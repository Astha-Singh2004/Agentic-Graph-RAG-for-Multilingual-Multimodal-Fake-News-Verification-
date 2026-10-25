from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class EvidenceCandidate(BaseModel):
    evidence_id: str
    claim_id: Optional[str] = None
    article_id: Optional[str] = None
    evidence_text: str
    source: str = "Verified News Wire"
    source_type: str = "OFFICIAL"  # OFFICIAL, INSTITUTIONAL, NEWS
    published_at: Optional[str] = None
    bm25_score: float = Field(0.0, description="BM25 sparse keyword ranking score")
    vector_score: float = Field(0.0, description="BGE-M3 dense semantic similarity score")
    source_reliability: float = Field(0.85, description="Historical source credibility rating (0.0 - 1.0)")
    temporal_score: float = Field(0.80, description="Temporal freshness alignment score")
    evidence_score: float = Field(0.0, description="Combined evidence retrieval score")
    nli_label: Optional[str] = None
    entailment_score: Optional[float] = None
    contradiction_score: Optional[float] = None
    neutral_score: Optional[float] = None

class GraphPathInfo(BaseModel):
    source_entity: str
    target_entity: str
    shortest_path: List[str]
    path_length: int
    hops: int
    weight: float
    relational_consistency: float

class HybridRetrievalRequest(BaseModel):
    claim_text: str
    subject: Optional[str] = None
    predicate: Optional[str] = None
    object: Optional[str] = None
    location: Optional[str] = None
    top_k: int = 5
    enable_graph_rag: bool = True

class HybridRetrievalResponse(BaseModel):
    query: str
    top_candidates: List[EvidenceCandidate]
    graph_context: Optional[GraphPathInfo] = None
    subgraph_nodes: List[Dict[str, Any]] = []
    subgraph_edges: List[Dict[str, Any]] = []
    retrieval_metadata: Dict[str, Any] = {}
