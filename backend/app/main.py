import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import engine, Base
from app.routers import auth, documents, chat

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize MySQL relational database tables
try:
    logger.info("Initializing MySQL database tables...")
    import app.db.models  # Register models with Base
    Base.metadata.create_all(bind=engine)
    logger.info("MySQL tables initialized successfully.")
except Exception as e:
    logger.error(f"MySQL table initialization failed: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="DueDiligence Pro AI - Document Analysis & RAG Platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Policy configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(documents.router, prefix=f"{settings.API_V1_STR}/documents", tags=["Documents"])
app.include_router(chat.router, prefix=f"{settings.API_V1_STR}", tags=["RAG Chat"])


@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint verifying MySQL connection status."""
    db_status = "ok"
    db_error = None
    try:
        from sqlalchemy import text
        from app.db.database import SessionLocal
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception as e:
        db_status = "error"
        db_error = str(e)

    return {
        "status": "healthy" if db_status == "ok" else "degraded",
        "database": db_status,
        "database_error": db_error,
        "app_name": settings.PROJECT_NAME,
        "gemini_configured": bool(settings.GEMINI_API_KEY)
    }


@app.get("/", tags=["Root"])
def root_endpoint():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API. Visit /docs for API documentation."
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
