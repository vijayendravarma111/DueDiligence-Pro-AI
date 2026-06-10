from typing import Any, Optional
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.api import deps
from app.database.session import get_db
from app.models.models import Document, ChatHistory, User
from app.schemas.schemas import DashboardKPIs, DashboardTrendResponse, TrendData

router = APIRouter()

@router.get("/kpis", response_model=DashboardKPIs)
def get_dashboard_kpis(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    company_id: Optional[int] = None
) -> Any:
    """Retrieve top-level KPI metrics for the dashboard."""
    # 1. Documents Count
    doc_query = db.query(func.count(Document.id))
    if company_id is not None:
        doc_query = doc_query.filter(Document.company_id == company_id)
    doc_count = doc_query.scalar() or 0

    # 2. Average Risk Score
    risk_query = db.query(func.avg(Document.risk_score)).filter(Document.risk_score.isnot(None))
    if company_id is not None:
        risk_query = risk_query.filter(Document.company_id == company_id)
    avg_risk = float(risk_query.scalar() or 0.0)

    # 3. Average Investment Score
    inv_query = db.query(func.avg(Document.investment_score)).filter(Document.investment_score.isnot(None))
    if company_id is not None:
        inv_query = inv_query.filter(Document.company_id == company_id)
    avg_inv = float(inv_query.scalar() or 0.0)

    # 4. Total AI Queries
    # Count chat history associated with the documents of this company
    chat_query = db.query(func.count(ChatHistory.id)).join(Document, ChatHistory.document_id == Document.id)
    if company_id is not None:
        chat_query = chat_query.filter(Document.company_id == company_id)
    chat_count = chat_query.scalar() or 0

    return {
        "documents_uploaded": doc_count,
        "avg_risk_score": round(avg_risk, 1),
        "avg_investment_score": round(avg_inv, 1),
        "total_ai_queries": chat_count
    }

@router.get("/trends", response_model=DashboardTrendResponse)
def get_dashboard_trends(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    company_id: Optional[int] = None
) -> Any:
    """Retrieve chronological trends for Risk and Investment scores."""
    # Fetch completed documents ordered by upload date ascending for line charts
    query = db.query(Document).filter(Document.status == "completed")
    if company_id is not None:
        query = query.filter(Document.company_id == company_id)
    
    docs = query.order_by(Document.upload_date.asc()).all()
    
    risk_trend = []
    investment_trend = []
    
    for doc in docs:
        date_str = doc.upload_date.strftime("%Y-%m-%d")
        if doc.risk_score is not None:
            risk_trend.append(
                TrendData(
                    date=date_str,
                    score=float(doc.risk_score),
                    document_name=doc.file_name
                )
            )
        if doc.investment_score is not None:
            investment_trend.append(
                TrendData(
                    date=date_str,
                    score=float(doc.investment_score),
                    document_name=doc.file_name
                )
            )
            
    return {
        "risk_trend": risk_trend,
        "investment_trend": investment_trend
    }
