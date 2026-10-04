import os
import json
import uuid
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_current_user
from app.db.database import get_db
from app.db.models import User, Document, DocumentAnalysis
from app.schemas.document import DocumentResponse, DocumentDetailResponse, DocumentAnalysisResponse
from app.services.document_service import process_and_index_document, delete_document_completely
from app.services.gemini_service import generate_risk_analysis, generate_investment_analysis
from app.utils.document_parser import extract_text

logger = logging.getLogger(__name__)

router = APIRouter()

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB max upload limit
ALLOWED_EXTENSIONS = {"pdf", "docx", "doc"}


def _parse_analysis_response(analysis: DocumentAnalysis) -> DocumentAnalysisResponse:
    summary_dict = json.loads(analysis.summary) if isinstance(analysis.summary, str) else analysis.summary
    risk_dict = json.loads(analysis.risk_analysis) if analysis.risk_analysis and isinstance(analysis.risk_analysis, str) else analysis.risk_analysis
    investment_dict = json.loads(analysis.investment_analysis) if analysis.investment_analysis and isinstance(analysis.investment_analysis, str) else analysis.investment_analysis

    return DocumentAnalysisResponse(
        id=analysis.id,
        document_id=analysis.document_id,
        summary=summary_dict,
        risk_analysis=risk_dict,
        investment_analysis=investment_dict,
        created_at=analysis.created_at
    )


@router.post("/upload", response_model=DocumentDetailResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a due-diligence document (PDF or DOCX), extract text, chunk, embed, index in ChromaDB,
    and generate initial Executive Summary, Risk Analysis, and Investment Analysis.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file filename provided.")

    filename = file.filename
    ext = filename.split(".")[-1].lower() if "." in filename else ""

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '.{ext}'. Only PDF and DOCX files are allowed."
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum allowed limit of {MAX_FILE_SIZE // (1024 * 1024)}MB."
        )

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    safe_filename = f"{uuid.uuid4().hex}_{filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    new_doc = Document(
        user_id=current_user.id,
        filename=filename,
        file_type=ext,
        file_path=file_path,
        status="processing"
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    try:
        processed_doc = process_and_index_document(new_doc.id, db)
    except Exception as e:
        logger.error(f"Document processing failed for {filename}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process document: {str(e)}"
        )

    analysis_resp = None
    if processed_doc.analysis:
        analysis_resp = _parse_analysis_response(processed_doc.analysis)

    return DocumentDetailResponse(
        id=processed_doc.id,
        user_id=processed_doc.user_id,
        filename=processed_doc.filename,
        file_type=processed_doc.file_type,
        file_path=processed_doc.file_path,
        status=processed_doc.status,
        created_at=processed_doc.created_at,
        analysis=analysis_resp
    )


@router.get("", response_model=List[DocumentResponse])
@router.get("/", response_model=List[DocumentResponse])
def get_user_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all documents belonging to the authenticated user."""
    docs = db.query(Document).filter(Document.user_id == current_user.id).order_by(Document.created_at.desc()).all()
    return docs


@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document_details(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve details and executive summary for a specific document."""
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or access denied.")

    analysis_resp = None
    if doc.analysis:
        analysis_resp = _parse_analysis_response(doc.analysis)

    return DocumentDetailResponse(
        id=doc.id,
        user_id=doc.user_id,
        filename=doc.filename,
        file_type=doc.file_type,
        file_path=doc.file_path,
        status=doc.status,
        created_at=doc.created_at,
        analysis=analysis_resp
    )


@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a document and its associated vectors and analysis."""
    success = delete_document_completely(document_id, current_user.id, db)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found or access denied.")
    return {"message": "Document successfully deleted."}


@router.post("/{document_id}/summary", response_model=DocumentAnalysisResponse)
def generate_summary(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch or regenerate the Executive Summary for a document."""
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or access denied.")

    if not doc.analysis:
        doc = process_and_index_document(document_id, db)

    return _parse_analysis_response(doc.analysis)


@router.post("/{document_id}/risk-analysis")
def get_risk_analysis_endpoint(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch or generate Risk Analysis Report for a document."""
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or access denied.")

    if not doc.analysis or not doc.analysis.risk_analysis:
        text = extract_text(doc.file_path, doc.file_type)
        risk_dict = generate_risk_analysis(text, doc.filename)
        risk_json = json.dumps(risk_dict, ensure_ascii=False)

        if not doc.analysis:
            doc.analysis = DocumentAnalysis(document_id=doc.id, summary="{}", risk_analysis=risk_json)
        else:
            doc.analysis.risk_analysis = risk_json
        db.commit()
    else:
        risk_dict = json.loads(doc.analysis.risk_analysis) if isinstance(doc.analysis.risk_analysis, str) else doc.analysis.risk_analysis

    return risk_dict


@router.post("/{document_id}/investment-analysis")
def get_investment_analysis_endpoint(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch or generate Investment Analysis Report for a document."""
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or access denied.")

    if not doc.analysis or not doc.analysis.investment_analysis:
        text = extract_text(doc.file_path, doc.file_type)
        inv_dict = generate_investment_analysis(text, doc.filename)
        inv_json = json.dumps(inv_dict, ensure_ascii=False)

        if not doc.analysis:
            doc.analysis = DocumentAnalysis(document_id=doc.id, summary="{}", investment_analysis=inv_json)
        else:
            doc.analysis.investment_analysis = inv_json
        db.commit()
    else:
        inv_dict = json.loads(doc.analysis.investment_analysis) if isinstance(doc.analysis.investment_analysis, str) else doc.analysis.investment_analysis

    return inv_dict
