import logging
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.database.session import get_db
from app.models.models import User, Document, ChatHistory, Report
from app.schemas.schemas import ChatQuestion, ChatResponse, ChatHistoryResponse
from app.services import ai_service, report_generator

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/{document_id}", response_model=ChatResponse)
def ask_document_question(
    document_id: int,
    question_in: ChatQuestion,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Ask a question about a specific document (strictly isolated context)."""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if document.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Document processing status: {document.status}. Cannot run query yet."
        )

    try:
        # Run chat query
        response = ai_service.query_ai_assistant(
            document_id=document_id,
            question=question_in.question,
            user_id=current_user.id,
            db=db
        )
        
        # Build PDF & DOCX of this specific answer automatically
        report = db.query(Report).filter(
            Report.document_id == document_id,
            Report.report_type == "chat"
        ).order_by(Report.created_at.desc()).first()
        
        if report:
            report_generator.build_pdf_report(report.id, db)
            report_generator.build_docx_report(report.id, db)
            
        return response
        
    except Exception as e:
        logger.error(f"Error during AI Assistant execution: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to query AI Assistant: {str(e)}"
        )

@router.get("/{document_id}", response_model=List[ChatHistoryResponse])
def get_chat_history(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Retrieve all QA history for a specific document."""
    history = db.query(ChatHistory).filter(
        ChatHistory.document_id == document_id
    ).order_by(ChatHistory.created_at.asc()).all()
    return history
