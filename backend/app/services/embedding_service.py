import logging
from typing import List
import google.generativeai as genai
from app.core.config import settings

logger = logging.getLogger(__name__)

_fallback_ef = None


def _get_fallback_ef():
    global _fallback_ef
    if _fallback_ef is None:
        try:
            from chromadb.utils.embedding_functions import DefaultEmbeddingFunction
            _fallback_ef = DefaultEmbeddingFunction()
        except Exception as e:
            logger.warning(f"ChromaDB DefaultEmbeddingFunction unavailable: {e}")
            _fallback_ef = None
    return _fallback_ef


def generate_embeddings(texts: List[str], is_query: bool = False) -> List[List[float]]:
    """
    Generates real embeddings using Google Gemini API (models/gemini-embedding-001).
    Batches inputs to prevent API rate limits.
    If Gemini API is unavailable or quota is exceeded, seamlessly falls back to ChromaDB standard model.
    """
    if not texts:
        return []

    # 1. Try Gemini API Batch Embedding
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY.strip())
            task_type = "retrieval_query" if is_query else "retrieval_document"

            embeddings = []
            batch_size = 50
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                res = genai.embed_content(
                    model="models/gemini-embedding-001",
                    content=batch,
                    task_type=task_type
                )
                if isinstance(res, dict) and "embedding" in res:
                    emb = res["embedding"]
                    if len(batch) == 1 and len(emb) > 0 and isinstance(emb[0], float):
                        embeddings.append(emb)
                    else:
                        embeddings.extend(emb)

            if len(embeddings) == len(texts):
                logger.info(f"Successfully generated {len(embeddings)} embeddings via Gemini API.")
                return embeddings
        except Exception as e:
            logger.warning(f"Gemini API embedding batch generation failed: {e}. Falling back to standard embedding model.")

    # 2. Fallback to ChromaDB standard embedding model
    fallback_ef = _get_fallback_ef()
    if fallback_ef:
        try:
            embeddings = fallback_ef(texts)
            embeddings = [[float(val) for val in vec] for vec in embeddings]
            logger.info(f"Generated {len(embeddings)} embeddings via ChromaDB default embedding model.")
            return embeddings
        except Exception as e:
            logger.error(f"Fallback embedding function failed: {e}")

    # 3. Deterministic word-embedding fallback
    return [_deterministic_vector(t) for t in texts]


def _deterministic_vector(text: str, dim: int = 384) -> List[float]:
    import hashlib
    words = text.lower().split()
    vec = [0.0] * dim
    for word in words:
        h = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16)
        idx = h % dim
        vec[idx] += 1.0

    norm = sum(v * v for v in vec) ** 0.5
    if norm > 0:
        vec = [v / norm for v in vec]
    return vec
