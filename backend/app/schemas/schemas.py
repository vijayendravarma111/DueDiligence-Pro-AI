from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# Authentication & User
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    role: str = "analyst"

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None

# Company
class CompanyCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)

class CompanyResponse(BaseModel):
    id: int
    name: str
    created_at: datetime

    class Config:
        from_attributes = True

# Document
class DocumentResponse(BaseModel):
    id: int
    company_id: int
    file_name: str
    file_path: str
    file_type: str
    risk_score: Optional[int] = None
    investment_score: Optional[int] = None
    status: str
    upload_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True

# Chat / AI Assistant
class ChatQuestion(BaseModel):
    question: str

class ChatResponse(BaseModel):
    question: str
    answer: str
    confidence_score: float
    supporting_evidence: Optional[str] = None
    doc_source: Optional[str] = None

    class Config:
        from_attributes = True

class ChatHistoryResponse(BaseModel):
    id: int
    document_id: int
    user_id: int
    question: str
    answer: str
    confidence_score: float
    supporting_evidence: Optional[str] = None
    doc_source: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Report
class ReportResponse(BaseModel):
    id: int
    company_id: int
    document_id: int
    report_type: str
    title: str
    pdf_path: Optional[str] = None
    docx_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ReportDetailResponse(ReportResponse):
    content: str

# Dashboard & Analytics
class DashboardKPIs(BaseModel):
    documents_uploaded: int
    avg_risk_score: float
    avg_investment_score: float
    total_ai_queries: int

class TrendData(BaseModel):
    date: str
    score: float
    document_name: str

class DashboardTrendResponse(BaseModel):
    risk_trend: List[TrendData]
    investment_trend: List[TrendData]
