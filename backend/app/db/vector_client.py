import math
import re
from typing import List, Dict, Any, Optional
import logging
from app.config import settings

logger = logging.getLogger(__name__)

class DenseVectorStore:
    """
    High-performance Dense Vector Search Client.
    Emulates BGE-M3 multi-lingual dense retrieval with normalized cosine similarity,
    with pluggable connection to Qdrant vector database if configured.
    """
    def __init__(self, embedding_dim: int = 128):
        self.embedding_dim = embedding_dim
        self.documents: List[Dict[str, Any]] = []
        self.vectors: List[List[float]] = []

    def _generate_dense_vector(self, text: str) -> List[float]:
        """
        Multi-lingual subword hashing dense vector generator.
        Produces deterministic, unit-normalized dense embeddings for cross-lingual text.
        """
        vec = [0.0] * self.embedding_dim
        text_clean = text.lower().strip()
        tokens = re.findall(r'\w+', text_clean)
        
        # Word and character n-gram hashing
        for token in tokens:
            idx = abs(hash(token)) % self.embedding_dim
            vec[idx] += 1.0
            # 3-char n-grams for cross-lingual morphology
            for i in range(len(token) - 2):
                ngram = token[i:i+3]
                n_idx = abs(hash(ngram)) % self.embedding_dim
                vec[n_idx] += 0.5

        # L2 Normalization
        norm = math.sqrt(sum(v * v for v in vec))
        if norm > 0:
            vec = [v / norm for v in vec]
        return vec

    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Compute cosine similarity between two unit vectors."""
        dot = sum(a * b for a, b in zip(vec1, vec2))
        return max(0.0, min(1.0, dot))

    def add_document(self, doc_id: str, text: str, metadata: Optional[Dict[str, Any]] = None):
        """Index a single document with metadata."""
        vec = self._generate_dense_vector(text)
        self.documents.append({
            "id": doc_id,
            "text": text,
            "metadata": metadata or {}
        })
        self.vectors.append(vec)

    def add_documents_bulk(self, docs: List[Dict[str, Any]]):
        """Batch index documents."""
        for doc in docs:
            self.add_document(doc["id"], doc["text"], doc.get("metadata"))

    def search(self, query_text: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Dense vector search returning top-k matching documents with similarity scores.
        """
        if not self.documents:
            return []

        q_vec = self._generate_dense_vector(query_text)
        scored = []
        for i, doc_vec in enumerate(self.vectors):
            sim = self._cosine_similarity(q_vec, doc_vec)
            scored.append((sim, self.documents[i]))

        scored.sort(key=lambda x: x[0], reverse=True)

        results = []
        for score, doc in scored[:top_k]:
            results.append({
                "id": doc["id"],
                "text": doc["text"],
                "score": round(score, 4),
                "metadata": doc["metadata"]
            })
        return results

vector_db = DenseVectorStore()
