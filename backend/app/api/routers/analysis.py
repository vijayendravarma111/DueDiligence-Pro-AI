import logging
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.database.session import get_db
from app.models.models import Document, User, Report
from app.services import ai_service, report_generator

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/risk/{document_id}", response_model=Dict[str, Any])
def run_risk_analysis(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Run AI Risk Analysis on a specific document."""
    # 1. Fetch document and check status
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if document.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Document is currently in status: {document.status}. Please wait for processing to complete."
        )

    try:
        # Check if report already exists for this document to prevent duplicate AI queries
        existing_report = db.query(Report).filter(
            Report.document_id == document_id,
            Report.report_type == "risk"
        ).first()
        
        if existing_report:
            import json
            report_data = json.loads(existing_report.content)
            # Re-generate files in case they were deleted
            report_generator.build_pdf_report(existing_report.id, db)
            report_generator.build_docx_report(existing_report.id, db)
            return report_data

        # 2. Run analysis
        report_data = ai_service.perform_risk_analysis(document_id, db)
        
        # 3. Find created report to build PDF & DOCX
        report = db.query(Report).filter(
            Report.document_id == document_id,
            Report.report_type == "risk"
        ).first()
        
        if report:
            report_generator.build_pdf_report(report.id, db)
            report_generator.build_docx_report(report.id, db)
            
        return report_data
        
    except Exception as e:
        logger.error(f"Error during risk analysis execution: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to execute risk analysis: {str(e)}"
        )

@router.post("/investment/{document_id}", response_model=Dict[str, Any])
def run_investment_analysis(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Run AI Investment Analysis on a specific document."""
    # 1. Fetch document and check status
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if document.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Document is currently in status: {document.status}. Please wait for processing to complete."
        )

    try:
        # Check if report already exists
        existing_report = db.query(Report).filter(
            Report.document_id == document_id,
            Report.report_type == "investment"
        ).first()
        
        if existing_report:
            import json
            report_data = json.loads(existing_report.content)
            # Re-generate files
            report_generator.build_pdf_report(existing_report.id, db)
            report_generator.build_docx_report(existing_report.id, db)
            return report_data

        # 2. Run analysis
        report_data = ai_service.perform_investment_analysis(document_id, db)
        
        # 3. Find created report to build PDF & DOCX
        report = db.query(Report).filter(
            Report.document_id == document_id,
            Report.report_type == "investment"
        ).first()
        
        if report:
            report_generator.build_pdf_report(report.id, db)
            report_generator.build_docx_report(report.id, db)
            
        return report_data
        
    except Exception as e:
        logger.error(f"Error during investment analysis execution: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to execute investment analysis: {str(e)}"
        )
