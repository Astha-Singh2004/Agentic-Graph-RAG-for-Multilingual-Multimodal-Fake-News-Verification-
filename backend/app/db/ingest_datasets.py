import os
import csv
import json
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional
from app.config import settings
from app.db.vector_client import vector_db

logger = logging.getLogger(__name__)

class DatasetStore:
    """
    In-memory indexed store and dataset manager for all 14 datasets.
    Provides fast lookup by article_id, claim_id, category, and language,
    as well as pagination and statistical summaries.
    """
    def __init__(self):
        self.data_dir = settings.DATA_PATH
        self.articles_sample: List[Dict[str, Any]] = []
        self.claims_sample: List[Dict[str, Any]] = []
        self.entities: List[Dict[str, Any]] = []
        self.evidence_sample: List[Dict[str, Any]] = []
        self.nli_sample: List[Dict[str, Any]] = []
        self.social_posts_sample: List[Dict[str, Any]] = []
        self.image_metadata_sample: List[Dict[str, Any]] = []
        self.verification_results_sample: List[Dict[str, Any]] = []
        self.test_samples: List[Dict[str, Any]] = []
        
        # Fast lookup indices
        self.claim_by_article: Dict[str, List[Dict[str, Any]]] = {}
        self.evidence_by_claim: Dict[str, List[Dict[str, Any]]] = {}
        self.verdict_by_article: Dict[str, Dict[str, Any]] = {}
        self.stats: Dict[str, Any] = {}
        
        self.load_all_datasets()

    def load_all_datasets(self, sample_limit: int = 5000):
        """Loads dataset samples into memory for rapid API response."""
        logger.info("Initializing DatasetStore from CSV files...")
        
        # 1. Dataset Statistics
        stats_file = self.data_dir.parent / "dataset_statistics.json"
        if not stats_file.exists():
            stats_file = self.data_dir / "dataset_statistics.json"
        if stats_file.exists():
            try:
                with open(stats_file, "r", encoding="utf-8") as f:
                    self.stats = json.load(f)
            except Exception as e:
                logger.error(f"Error loading dataset_statistics.json: {e}")

        # 2. 03_entities.csv (Load all 29)
        self._load_csv("03_entities.csv", self.entities, limit=100)

        # 3. 02_claims.csv (Load sample for instant testing & retrieval)
        self._load_csv("02_claims.csv", self.claims_sample, limit=sample_limit)
        for c in self.claims_sample:
            aid = c.get("article_id", "")
            self.claim_by_article.setdefault(aid, []).append(c)

        # 4. 05_evidence.csv
        self._load_csv("05_evidence.csv", self.evidence_sample, limit=sample_limit)
        for ev in self.evidence_sample:
            cid = ev.get("claim_id", "")
            self.evidence_by_claim.setdefault(cid, []).append(ev)
            # Add to vector store for hybrid retrieval
            vector_db.add_document(
                doc_id=ev.get("evidence_id", ""),
                text=ev.get("evidence_text", ""),
                metadata={
                    "claim_id": cid,
                    "article_id": ev.get("article_id", ""),
                    "source": ev.get("source", ""),
                    "source_type": ev.get("source_type", "OFFICIAL"),
                    "bm25_score": float(ev.get("bm25_score", 0.8)),
                    "vector_score": float(ev.get("vector_score", 0.85)),
                    "source_reliability": float(ev.get("source_reliability", 0.9)),
                    "temporal_score": float(ev.get("temporal_score", 0.88)),
                    "evidence_score": float(ev.get("evidence_score", 0.86)),
                }
            )

        # 5. 01_news_articles.csv
        self._load_csv("01_news_articles.csv", self.articles_sample, limit=sample_limit)

        # 6. 06_nli_training.csv
        self._load_csv("06_nli_training.csv", self.nli_sample, limit=1000)

        # 7. 08_social_posts.csv
        self._load_csv("08_social_posts.csv", self.social_posts_sample, limit=1000)

        # 8. 09_image_metadata.csv
        self._load_csv("09_image_metadata.csv", self.image_metadata_sample, limit=1000)

        # 9. 10_verification_results.csv
        self._load_csv("10_verification_results.csv", self.verification_results_sample, limit=sample_limit)
        for vr in self.verification_results_sample:
            aid = vr.get("article_id", "")
            self.verdict_by_article[aid] = vr

        # 10. 14_test.csv (For model evaluation)
        self._load_csv("14_test.csv", self.test_samples, limit=sample_limit)

        logger.info(f"Loaded Datasets: {len(self.articles_sample)} articles, {len(self.claims_sample)} claims, "
                    f"{len(self.evidence_sample)} evidence candidates, {len(self.entities)} entities.")

    def _load_csv(self, filename: str, target_list: List[Dict[str, Any]], limit: int = 5000):
        path = self.data_dir / filename
        if not path.exists():
            logger.warning(f"File not found: {path}")
            return
        try:
            with open(path, mode="r", encoding="utf-8", errors="ignore") as f:
                reader = csv.DictReader(f)
                count = 0
                for row in reader:
                    target_list.append(row)
                    count += 1
                    if limit and count >= limit:
                        break
        except Exception as e:
            logger.error(f"Error reading {filename}: {e}")

    def get_dataset_page(self, dataset_name: str, page: int = 1, page_size: int = 20, search: str = "") -> Dict[str, Any]:
        """Returns paginated rows for dataset explorer."""
        dataset_map = {
            "01_news_articles": self.articles_sample,
            "02_claims": self.claims_sample,
            "03_entities": self.entities,
            "05_evidence": self.evidence_sample,
            "06_nli_training": self.nli_sample,
            "08_social_posts": self.social_posts_sample,
            "09_image_metadata": self.image_metadata_sample,
            "10_verification_results": self.verification_results_sample,
            "14_test": self.test_samples
        }
        
        items = dataset_map.get(dataset_name, self.articles_sample)
        if search:
            s = search.lower()
            filtered = [
                row for row in items
                if any(s in str(v).lower() for v in row.values())
            ]
        else:
            filtered = items

        total = len(filtered)
        start = (page - 1) * page_size
        end = start + page_size
        paged_items = filtered[start:end]

        return {
            "dataset_name": dataset_name,
            "total_records": total,
            "page": page,
            "page_size": page_size,
            "total_pages": max(1, (total + page_size - 1) // page_size),
            "rows": paged_items
        }

dataset_store = DatasetStore()
