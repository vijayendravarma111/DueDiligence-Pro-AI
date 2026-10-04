import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "DueDiligence Pro AI"
    API_V1_STR: str = "/api/v1"

    # JWT Authentication
    SECRET_KEY: str = "super_secret_jwt_key_duediligence_pro_ai_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # Database Settings (MySQL)
    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: int = 3306
    MYSQL_USER: str = "root"
    MYSQL_PASSWORD: str = "Varma59"
    MYSQL_DATABASE: str = "due_diligence"
    DATABASE_URL: str = ""

    # Gemini API Key
    GEMINI_API_KEY: str = ""

    # Directory & Storage Settings
    UPLOAD_DIR: str = "uploads"
    CHROMA_PERSIST_DIR: str = "chroma_db"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"mysql+pymysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}"


settings = Settings()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)