from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

Base = declarative_base()

def get_engine_and_session():
    db_url = settings.DATABASE_URL or ""
    
    # Check if SQLite is forced or default
    if "mysql" not in db_url.lower():
        print("Using local SQLite database (MySQL url not configured)")
        db_url = "sqlite:///./due_diligence.db"
        return create_engine(db_url, connect_args={"check_same_thread": False})
        
    try:
        # Try creating MySQL engine with connection parameters
        eng = create_engine(
            db_url, 
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20
        )
        # Test connection immediately
        with eng.connect() as conn:
            pass
        return eng
    except Exception as e:
        print(f"Failed to connect to MySQL database at {db_url}: {e}. Falling back to SQLite.")
        db_url = "sqlite:///./due_diligence.db"
        return create_engine(db_url, connect_args={"check_same_thread": False})

engine = get_engine_and_session()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
