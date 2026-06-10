from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.database.session import get_db
from app.models.models import Report, User
from app.schemas.schemas import ReportResponse, ReportDetailResponse

router = APIRouter()

@router.get("/", response_model=List[ReportResponse])
def read_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    company_id: Optional[int] = None,
    document_id: Optional[int] = None,
    report_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> Any:
    """Retrieve list of generated reports."""
    query = db.query(Report)
    if company_id is not None:
        query = query.filter(Report.company_id == company_id)
    if document_id is not None:
        query = query.filter(Report.document_id == document_id)
    if report_type is not None:
        query = query.filter(Report.report_type == report_type)
        
    reports = query.order_by(Report.created_at.desc()).offset(skip).limit(limit).all()
    return reports

@router.get("/{report_id}", response_model=ReportDetailResponse)
def read_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Retrieve detailed report content by ID."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report
