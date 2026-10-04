import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.database import get_db
from app.db.models import User, Document, ChatMessage
from app.schemas.chat import ChatRequest, ChatResponse, ChatMessageHistory
from app.services.rag_service import retrieve_relevant_chunks
from app.services.gemini_service import answer_question_with_rag

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/documents/{document_id}/ask", response_model=ChatResponse)
def ask_question(
    document_id: int,
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    RAG-based Question Answering on an uploaded document.
    Retrieves context using ChromaDB semantic search filtered to the current user's document,
    and queries Google Gemini to produce a context-grounded response.
    """
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # Check document ownership
    document = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found or access denied.")

    if document.status != "completed":
        raise HTTPException(status_code=400, detail=f"Document is not ready yet. Status: {document.status}")

    # 1. Retrieve relevant chunks using RAG with user & document isolation
    context_chunks = retrieve_relevant_chunks(
        user_id=current_user.id,
        document_id=document.id,
        question=question,
        top_k=5
    )

    # 2. Query Gemini API with context
    rag_result = answer_question_with_rag(question, context_chunks, document.filename)

    # 3. Store in ChatMessage MySQL database
    chat_msg = ChatMessage(
        document_id=document.id,
        user_id=current_user.id,
        question=question,
        answer=rag_result.get("answer", ""),
        supporting_evidence=rag_result.get("supporting_evidence", ""),
        confidence_score=float(rag_result.get("confidence_score", 1.0))
    )
    db.add(chat_msg)
    db.commit()

    return ChatResponse(
        question=question,
        answer=rag_result.get("answer", ""),
        supporting_evidence=rag_result.get("supporting_evidence"),
        confidence_score=float(rag_result.get("confidence_score", 1.0)),
        doc_source=document.filename
    )


@router.get("/documents/{document_id}/chat-history", response_model=List[ChatMessageHistory])
def get_chat_history(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve chat history for a specific document."""
    document = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found or access denied.")

    messages = db.query(ChatMessage).filter(
        ChatMessage.document_id == document_id,
        ChatMessage.user_id == current_user.id
    ).order_by(ChatMessage.created_at.asc()).all()

    return messages
