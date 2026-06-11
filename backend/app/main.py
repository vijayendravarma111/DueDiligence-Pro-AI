import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.database.session import engine, Base
from app.api.routers import auth, companies, documents, analysis, chat, reports, dashboard
from app.core.config import settings

print("GEMINI KEY:", settings.GEMINI_API_KEY[:10] if settings.GEMINI_API_KEY else "EMPTY")
# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Create Database tables if they don't exist
import time
db_init_success = False
for attempt in range(5):
    try:
        logger.info(f"Initializing relational database tables (attempt {attempt + 1}/5)...")
        # Explicitly import all models to register them with Base.metadata before creation
        from app.models.models import User, Company, Document, DocumentChunk, ChatHistory, Report
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
        
        # Seed a default user if none exists
        from app.database.session import SessionLocal
        from app.core import security
        
        db = SessionLocal()
        try:
            user_count = db.query(User).count()
            if user_count == 0:
                logger.info("Database is empty. Seeding default user 'nani@example.com'...")
                default_user = User(
                    email="nani@example.com",
                    hashed_password=security.get_password_hash("password123"),
                    role="analyst"
                )
                db.add(default_user)
                db.commit()
                logger.info("Default user 'nani@example.com' seeded successfully (password: 'password123').")
        except Exception as seed_err:
            logger.error(f"Failed to seed default user: {seed_err}")
        finally:
            db.close()
            
        db_init_success = True
        break
    except Exception as e:
        logger.warning(f"Database initialization attempt {attempt + 1} failed: {e}. Retrying in 3 seconds...")
        if attempt < 4:
            time.sleep(3)

if not db_init_success:
    logger.critical("Database initialization failed after 5 attempts. Ensure the database service is running.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise due diligence, risk assessment, and Q&A analytics API.",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Policy configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve report files as static resources
reports_absolute_path = os.path.abspath(settings.REPORT_DIR)
os.makedirs(reports_absolute_path, exist_ok=True)
app.mount("/static/reports", StaticFiles(directory=reports_absolute_path), name="reports")

# Include Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(companies.router, prefix=f"{settings.API_V1_STR}/companies", tags=["Companies"])
app.include_router(documents.router, prefix=f"{settings.API_V1_STR}/documents", tags=["Documents"])
app.include_router(analysis.router, prefix=f"{settings.API_V1_STR}/analysis", tags=["Analysis"])
app.include_router(chat.router, prefix=f"{settings.API_V1_STR}/chat", tags=["AI Assistant Chat"])
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports", tags=["Reports"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["Dashboard"])

@app.get("/health", tags=["Health"])
def health_check():
    """Simple API health check endpoint with database diagnostics."""
    db_status = "ok"
    db_error = None
    tables_check = {}
    try:
        from app.database.session import SessionLocal
        from sqlalchemy import text
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        
        # Check tables
        from app.models.models import User
        try:
            user_count = db.query(User).count()
            tables_check["users"] = f"ok (count: {user_count})"
        except Exception as tbl_err:
            tables_check["users"] = f"error: {str(tbl_err)}"
            
        db.close()
    except Exception as e:
        db_status = "failed"
        db_error = str(e)
        
    return {
        "status": "healthy" if db_status == "ok" and not any("error" in str(v) for v in tables_check.values()) else "degraded",
        "database_connection": db_status,
        "database_error": db_error,
        "tables_status": tables_check,
        "app_name": settings.PROJECT_NAME,
        "chroma_host": settings.CHROMA_HOST,
        "gemini_api_key_configured": bool(settings.GEMINI_API_KEY)
    }

@app.get("/", tags=["Root"])
def root_endpoint():
    return {
        "message": f"Welcome to the {settings.PROJECT_NAME} API. Access API docs at /docs."
    }
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
