from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class ExecutiveSummarySchema(BaseModel):
    overview: str
    key_findings: List[str]
    important_risks: List[str]
    financial_business_info: str
    recommendations: List[str]


class DocumentAnalysisResponse(BaseModel):
    id: int
    document_id: int
    summary: Dict[str, Any]
    risk_analysis: Optional[Dict[str, Any]] = None
    investment_analysis: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    file_type: str
    file_path: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentDetailResponse(DocumentResponse):
    analysis: Optional[DocumentAnalysisResponse] = None
