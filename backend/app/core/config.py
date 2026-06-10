import os

from pydantic_settings import (
    BaseSettings,
    SettingsConfigDict
)


class Settings(BaseSettings):
    PROJECT_NAME: str = "DueDiligence Pro AI"
    API_V1_STR: str = "/api/v1"

    # JWT Auth
    SECRET_KEY: str = "super_secret_key_change_me_in_production_123456"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # Database
    DATABASE_URL: str = (
        "mysql+pymysql://root:Varma59@localhost:3306/due_diligence"
    )

    # ChromaDB
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8001
    CHROMA_COLLECTION_NAME: str = "due_diligence_documents"

    # Gemini
    GEMINI_API_KEY: str = ""

    # Directories
    UPLOAD_DIR: str = "uploads"
    REPORT_DIR: str = "reports"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()

print(
    "GEMINI KEY:",
    settings.GEMINI_API_KEY[:15]
    if settings.GEMINI_API_KEY
    else "EMPTY"
)

print(
    "DATABASE:",
    settings.DATABASE_URL
)

print(
    "CHROMA:",
    f"{settings.CHROMA_HOST}:{settings.CHROMA_PORT}"
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.REPORT_DIR, exist_ok=True)