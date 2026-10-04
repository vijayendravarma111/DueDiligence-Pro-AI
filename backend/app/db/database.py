import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

db_url = settings.get_database_url()

if "mysql" not in db_url.lower():
    raise RuntimeError(
        f"Invalid database configuration. MySQL is required, but got DATABASE_URL: {db_url}"
    )

logger.info(f"Initializing MySQL database connection to {settings.MYSQL_HOST}:{settings.MYSQL_PORT}/{settings.MYSQL_DATABASE}")

try:
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_recycle=3600,
        pool_size=10,
        max_overflow=20
    )
except Exception as e:
    logger.critical(f"Failed to create MySQL database engine: {e}")
    raise RuntimeError(f"Could not connect to MySQL database: {e}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
