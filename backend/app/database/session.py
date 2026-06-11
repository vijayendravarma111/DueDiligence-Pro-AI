from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

Base = declarative_base()

def get_engine_and_session():
    db_url = settings.DATABASE_URL or ""
    
    # Handle database URL if configured
    if db_url:
        # Resolve Heroku/Render postgres:// scheme to postgresql:// for SQLAlchemy
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
            
        # If it's explicitly SQLite, use it directly
        if db_url.startswith("sqlite:///"):
            print("Using SQLite database configured in env.")
            return create_engine(db_url, connect_args={"check_same_thread": False})
            
        # Retry loop for remote database connection to handle container startup network latency
        import time
        for attempt in range(5):
            try:
                # Print database host safely (without password)
                host_info = db_url.split("@")[-1] if "@" in db_url else db_url
                print(f"Connecting to database (attempt {attempt + 1}/5): {host_info}")
                
                # Setup pool parameters based on DB type
                if "sqlite" in db_url.lower():
                    eng = create_engine(db_url, connect_args={"check_same_thread": False})
                else:
                    eng = create_engine(
                        db_url, 
                        pool_pre_ping=True,
                        pool_size=10,
                        max_overflow=20
                    )
                # Test connection immediately
                with eng.connect() as conn:
                    pass
                print("Successfully connected to database.")
                return eng
            except Exception as e:
                host_info = db_url.split("@")[-1] if "@" in db_url else db_url
                print(f"Database connection attempt {attempt + 1} failed: {e}. Retrying in 3 seconds...")
                if attempt < 4:
                    time.sleep(3)
                    
        print("Failed to connect to database after 5 attempts. Falling back to SQLite.")
            
    # Default fallback SQLite database
    print("Using default local SQLite database: ./due_diligence.db")
    return create_engine("sqlite:///./due_diligence.db", connect_args={"check_same_thread": False})

engine = get_engine_and_session()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
