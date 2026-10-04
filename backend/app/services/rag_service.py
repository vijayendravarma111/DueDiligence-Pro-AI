import logging
import re
import chromadb
from chromadb.config import Settings as ChromaSettings
from chromadb.errors import InvalidDimensionException
from app.core.config import settings
from app.services.embedding_service import generate_embeddings

logger = logging.getLogger(__name__)

_chroma_client = None
COLLECTION_NAME = "due_diligence_chunks"


def get_chroma_client():
    global _chroma_client
    if _chroma_client is None:
        logger.info(f"Initializing local persistent ChromaDB at {settings.CHROMA_PERSIST_DIR}")
        _chroma_client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIR,
            settings=ChromaSettings(anonymized_telemetry=False)
        )
    return _chroma_client


def get_collection():
    client = get_chroma_client()
    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"}
    )


def add_document_chunks_to_vector_db(
    document_id: int,
    user_id: int,
    filename: str,
    chunks: list[str]
) -> None:
    """Generates embeddings and indexes chunks in ChromaDB with user and document isolation."""
    if not chunks:
        return

    embeddings = generate_embeddings(chunks, is_query=False)

    ids = [f"doc_{document_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [
        {
            "document_id": int(document_id),
            "user_id": int(user_id),
            "filename": str(filename),
            "chunk_index": int(i)
        }
        for i in range(len(chunks))
    ]

    try:
        collection = get_collection()
        collection.upsert(
            ids=ids,
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas
        )
    except (InvalidDimensionException, Exception) as e:
        logger.warning(f"ChromaDB dimension mismatch or indexing error ({e}). Resetting collection...")
        client = get_chroma_client()
        try:
            client.delete_collection(COLLECTION_NAME)
        except Exception:
            pass
        collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"}
        )
        collection.upsert(
            ids=ids,
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas
        )

    logger.info(f"Indexed {len(chunks)} chunks for document_id={document_id} in ChromaDB.")


def retrieve_relevant_chunks(
    user_id: int,
    document_id: int,
    question: str,
    top_k: int = 5
) -> list[str]:
    """
    RAG retrieval strictly filtered to the specified user_id and document_id.
    Includes self-healing automatic re-indexing and MySQL chunk search fallback.
    """
    query_embeddings = generate_embeddings([question], is_query=True)
    retrieved = []

    try:
        collection = get_collection()
        results = collection.query(
            query_embeddings=query_embeddings,
            n_results=top_k,
            where={"$and": [{"document_id": int(document_id)}, {"user_id": int(user_id)}]}
        )
        if results and "documents" in results and results["documents"] and results["documents"][0]:
            retrieved = results["documents"][0]
    except Exception as e:
        logger.warning(f"ChromaDB query filter error: {e}")

    # If ChromaDB returned valid chunks, return them
    if retrieved:
        logger.info(f"Retrieved {len(retrieved)} relevant chunks from ChromaDB for doc_id={document_id}.")
        return retrieved

    # Self-healing fallback: Check if MySQL contains chunks for this document
    logger.info(f"ChromaDB returned 0 chunks for doc_id={document_id}. Attempting automatic re-indexing from MySQL...")
    from app.db.database import SessionLocal
    from app.db.models import DocumentChunk, Document
    db = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == document_id, Document.user_id == user_id).first()
        if doc:
            db_chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).order_by(DocumentChunk.chunk_index).all()
            if db_chunks:
                chunk_texts = [c.text_content for c in db_chunks]
                logger.info(f"Re-indexing {len(chunk_texts)} chunks into ChromaDB for doc_id={document_id}...")
                add_document_chunks_to_vector_db(
                    document_id=doc.id,
                    user_id=doc.user_id,
                    filename=doc.filename,
                    chunks=chunk_texts
                )
                # Re-query ChromaDB after indexing
                try:
                    collection = get_collection()
                    results = collection.query(
                        query_embeddings=query_embeddings,
                        n_results=top_k,
                        where={"$and": [{"document_id": int(document_id)}, {"user_id": int(user_id)}]}
                    )
                    if results and "documents" in results and results["documents"] and results["documents"][0]:
                        retrieved = results["documents"][0]
                        if retrieved:
                            return retrieved
                except Exception as re_err:
                    logger.error(f"Re-indexed ChromaDB query failed: {re_err}")

                # If vector query still empty, rank MySQL chunks by keyword matching
                q_words = [w.lower() for w in re.findall(r'\w+', question) if len(w) > 3]
                if q_words:
                    scored = []
                    for c_text in chunk_texts:
                        score = sum(1 for w in q_words if w in c_text.lower())
                        scored.append((score, c_text))
                    scored.sort(key=lambda x: x[0], reverse=True)
                    matched = [c[1] for c in scored[:top_k] if c[0] > 0]
                    if matched:
                        logger.info(f"Retrieved {len(matched)} matching chunks from MySQL for doc_id={document_id}.")
                        return matched

                return chunk_texts[:top_k]
    except Exception as db_err:
        logger.error(f"MySQL chunk retrieval fallback failed: {db_err}")
    finally:
        db.close()

    return []


def delete_document_chunks_from_vector_db(document_id: int) -> None:
    """Removes all indexed chunks for a given document from ChromaDB."""
    try:
        collection = get_collection()
        collection.delete(where={"document_id": int(document_id)})
        logger.info(f"Deleted vector chunks for document_id={document_id} from ChromaDB.")
    except Exception as e:
        logger.error(f"Error deleting chunks from ChromaDB: {e}")
