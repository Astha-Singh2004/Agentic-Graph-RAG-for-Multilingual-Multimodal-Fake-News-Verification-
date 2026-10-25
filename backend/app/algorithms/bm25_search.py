import math
import re
from typing import List, Dict, Any, Optional
from collections import Counter
import logging

logger = logging.getLogger(__name__)

class BM25SearchEngine:
    """
    Okapi BM25 Sparse Keyword Ranking Engine.
    Implements standard Okapi BM25 with term frequency saturation (k1=1.5),
    document length normalization (b=0.75), and cross-lingual tokenization.
    """
    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.corpus: List[Dict[str, Any]] = []
        self.doc_lengths: List[int] = []
        self.avg_doc_len: float = 0.0
        self.doc_freqs: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self.doc_token_counts: List[Counter] = []

    def tokenize(self, text: str) -> List[str]:
        """Multi-lingual tokenization preserving Indic and Latin characters."""
        if not text:
            return []
        text_clean = text.lower().strip()
        tokens = re.findall(r'[\w]+', text_clean)
        # Filter 1-char noise
        return [t for t in tokens if len(t) > 1]

    def index_documents(self, documents: List[Dict[str, Any]], text_field: str = "evidence_text"):
        """
        Builds the inverted index and IDF weights over the document corpus.
        Each doc should have 'id' and the text field.
        """
        self.corpus = documents
        self.doc_lengths = []
        self.doc_token_counts = []
        self.doc_freqs = {}

        total_length = 0
        for doc in documents:
            text = doc.get(text_field, "")
            tokens = self.tokenize(text)
            length = len(tokens)
            self.doc_lengths.append(length)
            total_length += length
            
            counts = Counter(tokens)
            self.doc_token_counts.append(counts)

            # Record document frequency for each unique term
            for term in counts.keys():
                self.doc_freqs[term] = self.doc_freqs.get(term, 0) + 1

        n_docs = len(documents)
        self.avg_doc_len = (total_length / n_docs) if n_docs > 0 else 1.0

        # Calculate IDF for all indexed terms
        self.idf = {}
        for term, df in self.doc_freqs.items():
            # Robertson-Spärck Jones IDF formula with +1 smoothing
            self.idf[term] = math.log(((n_docs - df + 0.5) / (df + 0.5)) + 1.0)

        logger.info(f"BM25 index built with {n_docs} documents, {len(self.idf)} unique vocabulary terms.")

    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Calculates BM25 scores for query across all indexed documents.
        Returns top-k highest scoring documents with normalized scores.
        """
        if not self.corpus:
            return []

        q_tokens = self.tokenize(query)
        if not q_tokens:
            return []

        scores: List[float] = [0.0] * len(self.corpus)

        for i, token_counts in enumerate(self.doc_token_counts):
            doc_len = self.doc_lengths[i]
            score = 0.0

            for q_term in q_tokens:
                if q_term not in token_counts:
                    continue

                freq = token_counts[q_term]
                idf = self.idf.get(q_term, 0.0)

                # Okapi BM25 formula
                num = freq * (self.k1 + 1.0)
                denom = freq + self.k1 * (1.0 - self.b + self.b * (doc_len / self.avg_doc_len))
                score += idf * (num / denom)

            scores[i] = score

        max_score = max(scores) if scores and max(scores) > 0 else 1.0
        
        # Rank documents
        ranked_indices = sorted(range(len(scores)), key=lambda idx: scores[idx], reverse=True)

        results = []
        for idx in ranked_indices[:top_k]:
            raw_score = scores[idx]
            norm_score = raw_score / max_score if max_score > 0 else 0.0
            doc = self.corpus[idx]
            results.append({
                "id": doc.get("evidence_id") or doc.get("id"),
                "text": doc.get("evidence_text") or doc.get("text"),
                "raw_score": round(raw_score, 4),
                "score": round(norm_score, 4),
                "metadata": doc
            })

        return results

bm25_engine = BM25SearchEngine()
