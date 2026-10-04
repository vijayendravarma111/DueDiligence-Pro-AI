import os
import json
import logging
from sqlalchemy.orm import Session
from app.db.models import Document, DocumentChunk, DocumentAnalysis
from app.utils.document_parser import extract_text, chunk_text
from app.services.rag_service import add_document_chunks_to_vector_db, delete_document_chunks_from_vector_db
from app.services.gemini_service import generate_executive_summary, generate_risk_analysis, generate_investment_analysis

logger = logging.getLogger(__name__)


def process_and_index_document(document_id: int, db: Session) -> Document:
    """
    Executes complete document processing workflow:
    1. Fetch document from DB
    2. Extract text (PDF/DOCX)
    3. Split into chunks
    4. Store chunks in MySQL & ChromaDB
    5. Generate Executive Summary, Risk Analysis & Investment Analysis and store in MySQL
    6. Update status to completed
    """
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise ValueError(f"Document ID {document_id} not found.")

    try:
        logger.info(f"Processing document: {document.filename} (ID: {document.id})")

        # 1. Extract Text
        text = extract_text(document.file_path, document.file_type)
        if not text or not text.strip():
            raise ValueError("Extracted document text is empty.")

        # 2. Split into Chunks
        chunks = chunk_text(text, chunk_size=1000, chunk_overlap=200)
        if not chunks:
            raise ValueError("Failed to create text chunks from document.")

        logger.info(f"Split {document.filename} into {len(chunks)} chunks.")

        # 3. Store Chunks in MySQL
        db.query(DocumentChunk).filter(DocumentChunk.document_id == document.id).delete()
        for idx, chunk_content in enumerate(chunks):
            db_chunk = DocumentChunk(
                document_id=document.id,
                chunk_index=idx,
                text_content=chunk_content
            )
            db.add(db_chunk)
        db.commit()

        # 4. Store Chunks & Vector Embeddings in ChromaDB
        add_document_chunks_to_vector_db(
            document_id=document.id,
            user_id=document.user_id,
            filename=document.filename,
            chunks=chunks
        )

        # 5. Generate AI Reports (Executive Summary, Risk Analysis, Investment Analysis)
        summary_data = generate_executive_summary(text, document.filename)
        risk_data = generate_risk_analysis(text, document.filename)
        investment_data = generate_investment_analysis(text, document.filename)

        summary_json = json.dumps(summary_data, ensure_ascii=False)
        risk_json = json.dumps(risk_data, ensure_ascii=False)
        investment_json = json.dumps(investment_data, ensure_ascii=False)

        existing_analysis = db.query(DocumentAnalysis).filter(DocumentAnalysis.document_id == document.id).first()
        if existing_analysis:
            existing_analysis.summary = summary_json
            existing_analysis.risk_analysis = risk_json
            existing_analysis.investment_analysis = investment_json
        else:
            new_analysis = DocumentAnalysis(
                document_id=document.id,
                summary=summary_json,
                risk_analysis=risk_json,
                investment_analysis=investment_json
            )
            db.add(new_analysis)

        # 6. Mark Document Status as Completed
        document.status = "completed"
        db.add(document)
        db.commit()
        db.refresh(document)

        logger.info(f"Successfully processed and indexed document {document.filename}.")
        return document

    except Exception as e:
        logger.error(f"Error processing document {document.id}: {e}", exc_info=True)
        document.status = "failed"
        db.add(document)
        db.commit()
        db.refresh(document)
        raise e


def delete_document_completely(document_id: int, user_id: int, db: Session) -> bool:
    """Deletes document from MySQL, local storage, and ChromaDB."""
    document = db.query(Document).filter(Document.id == document_id, Document.user_id == user_id).first()
    if not document:
        return False

    # 1. Delete file from filesystem
    if os.path.exists(document.file_path):
        try:
            os.remove(document.file_path)
        except Exception as e:
            logger.warning(f"Could not remove local file {document.file_path}: {e}")

    # 2. Delete vectors from ChromaDB
    delete_document_chunks_from_vector_db(document_id)

    # 3. Delete from MySQL (cascade handles chunks, analysis, chat_messages)
    db.delete(document)
    db.commit()
    return True
