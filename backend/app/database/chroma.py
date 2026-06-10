import logging
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.core.config import settings

logger = logging.getLogger(__name__)

_chroma_client = None


def get_chroma_client():
    global _chroma_client

    if _chroma_client is None:
        logger.info(f"Connecting to remote ChromaDB at {settings.CHROMA_HOST}:{settings.CHROMA_PORT}")
        try:
            _chroma_client = chromadb.HttpClient(
                host=settings.CHROMA_HOST,
                port=int(settings.CHROMA_PORT),
                settings=ChromaSettings(
                    anonymized_telemetry=False
                )
            )
        except Exception as e:
            logger.error(f"Failed to connect to remote ChromaDB: {e}. Falling back to local persistent client.")
            _chroma_client = chromadb.PersistentClient(
                path="./chroma_db_data",
                settings=ChromaSettings(
                    anonymized_telemetry=False
                )
            )

    return _chroma_client


def get_collection():
    client = get_chroma_client()

    return client.get_or_create_collection(
        name=settings.CHROMA_COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"}
    )