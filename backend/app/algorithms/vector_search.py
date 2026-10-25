from typing import List, Dict, Any, Optional
import logging
from app.db.vector_client import vector_db
from app.algorithms.bm25_search import bm25_engine

logger = logging.getLogger(__name__)

class VectorSearchEngine:
    """
    BGE-M3 Dense Semantic Search & Hybrid Retrieval Fusion.
    Combines sparse keyword ranking (BM25) with dense vector representations
    using convex combination and reciprocal rank scoring.
    """
    def __init__(self, alpha: float = 0.5):
        self.alpha = alpha  # Weight for BM25 vs Vector (0.5 = equal balance)

    def dense_search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Dense semantic search using vector database."""
        return vector_db.search(query, top_k=top_k)

    def hybrid_search(
        self,
        query: str,
        top_k: int = 5,
        alpha: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        Executes hybrid retrieval:
        1. BM25 Sparse Search for exact lexical matches.
        2. BGE-M3 Dense Vector Search for cross-lingual semantic concepts.
        3. Merges and re-ranks candidate evidence pool.
        """
        a = alpha if alpha is not None else self.alpha
        
        # 1. Fetch top candidates from both engines
        bm25_results = bm25_engine.search(query, top_k=top_k * 2)
        vector_results = vector_db.search(query, top_k=top_k * 2)

        combined: Dict[str, Dict[str, Any]] = {}

        # Merge BM25 scores
        for item in bm25_results:
            did = item["id"]
            combined[did] = {
                "id": did,
                "text": item["text"],
                "bm25_score": item["score"],
                "vector_score": 0.0,
                "metadata": item.get("metadata", {})
            }

        # Merge Vector scores
        for item in vector_results:
            did = item["id"]
            if did in combined:
                combined[did]["vector_score"] = item["score"]
                # Merge metadata if missing
                if not combined[did]["metadata"] and item.get("metadata"):
                    combined[did]["metadata"] = item["metadata"]
            else:
                combined[did] = {
                    "id": did,
                    "text": item["text"],
                    "bm25_score": 0.0,
                    "vector_score": item["score"],
                    "metadata": item.get("metadata", {})
                }

        # Calculate fused hybrid score
        ranked_list = []
        for did, data in combined.items():
            bm25_s = data["bm25_score"]
            vec_s = data["vector_score"]
            fused_score = (a * bm25_s) + ((1.0 - a) * vec_s)
            
            # Incorporate source credibility and temporal score from metadata if available
            meta = data["metadata"] or {}
            src_rel = float(meta.get("source_reliability", 0.85))
            temp_s = float(meta.get("temporal_score", 0.85))
            
            # Final combined evidence score
            final_score = (fused_score * 0.7) + (src_rel * 0.2) + (temp_s * 0.1)

            ranked_list.append({
                "evidence_id": did,
                "evidence_text": data["text"],
                "bm25_score": round(bm25_s, 4),
                "vector_score": round(vec_s, 4),
                "source_reliability": round(src_rel, 4),
                "temporal_score": round(temp_s, 4),
                "evidence_score": round(final_score, 4),
                "source": meta.get("source", "Verified News Wire"),
                "source_type": meta.get("source_type", "OFFICIAL"),
                "claim_id": meta.get("claim_id"),
                "article_id": meta.get("article_id")
            })

        ranked_list.sort(key=lambda x: x["evidence_score"], reverse=True)
        return ranked_list[:top_k]

vector_search_engine = VectorSearchEngine()
