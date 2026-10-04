from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    question: str
    answer: str
    supporting_evidence: Optional[str] = None
    confidence_score: float = 1.0
    doc_source: str


class ChatMessageHistory(BaseModel):
    id: int
    document_id: int
    user_id: int
    question: str
    answer: str
    supporting_evidence: Optional[str] = None
    confidence_score: float
    created_at: datetime

    class Config:
        from_attributes = True
