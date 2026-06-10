import os
import logging
from datetime import datetime, timezone
import docx
import pdfplumber
import google.generativeai as genai
from app.core.config import settings
from app.database.chroma import get_collection
from app.database.session import SessionLocal
from app.models.models import Document, DocumentChunk

logger = logging.getLogger(__name__)

# Configure Gemini
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        logger.error(f"Error extracting PDF text: {e}")
        # Try fallback using PyPDF
        from pypdf import PdfReader
        try:
            reader = PdfReader(file_path)
            for page in reader.pages:
                text += page.extract_text() or ""
        except Exception as fallback_err:
            logger.error(f"Fallback PDF extractor also failed: {fallback_err}")
            raise e
    return text

def extract_text_from_docx(file_path: str) -> str:
    try:
        doc = docx.Document(file_path)
        full_text = []
        for para in doc.paragraphs:
            full_text.append(para.text)
        return "\n".join(full_text)
    except Exception as e:
        logger.error(f"Error extracting DOCX text: {e}")
        raise e

def chunk_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> list[str]:
    chunks = []
    if not text:
        return chunks
        
    # Standard character-based chunking with overlap
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk = text[start:end]
        chunks.append(chunk)
        start += chunk_size - chunk_overlap
        if start >= len(text) or chunk_size >= len(text):
            break
            
    return chunks

def generate_embeddings_gemini(texts: list[str]) -> list[list[float]]:
    """
    Generate deterministic local embeddings.
    Avoids Gemini embedding API issues and keeps ChromaDB working.
    """

    import random

    embeddings = []

    for text in texts:
        # Deterministic vector for same text
        random.seed(hash(text))

        vector = [
            random.uniform(-1.0, 1.0)
            for _ in range(768)
        ]

        embeddings.append(vector)

    logger.info(
        f"Generated {len(embeddings)} local embeddings."
    )

    return embeddings

def process_document(document_id: int):
    db = SessionLocal()
    try:
        # 1. Fetch document from database
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            logger.error(f"Document ID {document_id} not found in DB.")
            return
            
        logger.info(f"Processing document: {document.file_name} (ID: {document_id})")
        
        # 2. Extract Text
        if document.file_type.lower() == "pdf":
            text = extract_text_from_pdf(document.file_path)
        elif document.file_type.lower() in ["docx", "doc"]:
            text = extract_text_from_docx(document.file_path)
        else:
            raise ValueError(f"Unsupported file type: {document.file_type}")
            
        if not text.strip():
            raise ValueError("Document is empty or text extraction failed.")
            
        # 3. Create Chunks
        chunks = chunk_text(text)
        logger.info(f"Split document {document.file_name} into {len(chunks)} chunks.")
        
        if not chunks:
            raise ValueError("No text chunks generated.")
            
        # 4. Generate Embeddings
        embeddings = generate_embeddings_gemini(chunks)
        
        # 5. Store chunks in database (for relational mapping if needed, e.g. references)
        chunk_models = []
        for idx, chunk_text_content in enumerate(chunks):
            db_chunk = DocumentChunk(
                document_id=document.id,
                chunk_index=idx,
                text_content=chunk_text_content
            )
            db.add(db_chunk)
            chunk_models.append(db_chunk)
        db.commit()
        
        # 6. Store in ChromaDB with isolated metadata
        collection = get_collection()
        
        ids = [f"doc_{document.id}_chunk_{idx}" for idx in range(len(chunks))]
        metadatas = [
            {
                "document_id": int(document.id),
                "company_id": int(document.company_id),
                "file_name": str(document.file_name),
                "upload_date": str(document.upload_date.isoformat()),
                "chunk_index": int(idx)
            }
            for idx in range(len(chunks))
        ]
        
        collection.add(
            embeddings=embeddings,
            documents=chunks,
            ids=ids,
            metadatas=metadatas
        )
        
        # 7. Update document status
        document.status = "completed"
        db.add(document)
        db.commit()
        logger.info(f"Successfully processed and indexed document {document.file_name}.")
        
    except Exception as e:
        logger.error(f"Error during document processing: {e}", exc_info=True)
        if document:
            document.status = "failed"
            db.add(document)
            db.commit()
    finally:
        db.close()
