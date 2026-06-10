from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.database.session import get_db
from app.models.models import Company, User
from app.schemas.schemas import CompanyCreate, CompanyResponse

router = APIRouter()

@router.get("/", response_model=List[CompanyResponse])
def read_companies(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """Retrieve companies list."""
    companies = db.query(Company).offset(skip).limit(limit).all()
    return companies

@router.post("/", response_model=CompanyResponse)
def create_company(
    *,
    db: Session = Depends(get_db),
    company_in: CompanyCreate,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Create a new company."""
    existing_company = db.query(Company).filter(Company.name == company_in.name).first()
    if existing_company:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A company with this name already exists.",
        )
    company = Company(name=company_in.name)
    db.add(company)
    db.commit()
    db.refresh(company)
    return company
