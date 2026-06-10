import os
import uuid
import logging
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, status
from sqlalchemy.orm import Session
from app.api import deps
from app.core.config import settings
from app.database.session import get_db
from app.models.models import Document, User, Company
from app.schemas.schemas import DocumentResponse
from app.services.document_processor import process_document

router = APIRouter()
logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {"pdf", "docx"}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15MB file size limit

def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@router.get("/", response_model=List[DocumentResponse])
def read_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    company_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100
) -> Any:
    """Retrieve documents. Optional filter by company_id. Newest first."""
    query = db.query(Document)
    if company_id is not None:
        query = query.filter(Document.company_id == company_id)
    documents = query.order_by(Document.upload_date.desc()).offset(skip).limit(limit).all()
    return documents

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    company_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Upload and process a document (PDF or DOCX)."""
    # 1. Verify company exists
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # 2. File name validation
    if not file.filename or not allowed_file(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF and DOCX documents are supported."
        )

    # 3. File size check (read chunk by chunk or check content-length headers)
    # Since FastAPI uses SpooledTemporaryFile, we can read size:
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE // (1024*1024)}MB."
        )

    # 4. Save file to disk with unique identifier to prevent overwrites
    ext = file.filename.rsplit(".", 1)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    try:
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
    except Exception as e:
        logger.error(f"Failed to write uploaded file to disk: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save uploaded file."
        )

    # 5. Save record to DB with status 'processing'
    db_document = Document(
        company_id=company_id,
        file_name=file.filename,
        file_path=file_path,
        file_type=ext,
        status="processing"
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)

    # 6. Push to background worker pipeline
    background_tasks.add_task(process_document, db_document.id)

    return db_document
