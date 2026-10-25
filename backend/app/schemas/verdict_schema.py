from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.claim_schema import ClaimItem, SemanticTriple
from app.schemas.evidence_schema import EvidenceCandidate, GraphPathInfo

class SubScores(BaseModel):
    nli_entailment: float = 0.0
    nli_contradiction: float = 0.0
    nli_neutral: float = 0.0
    vector_similarity: float = 0.0
    bm25_relevance: float = 0.0
    source_reliability: float = 0.0
    temporal_consistency: float = 0.0
    graph_consistency: float = 0.0
    numeric_consistency: float = 0.0
    image_text_consistency: Optional[float] = None
    clip_score: Optional[float] = None

class VerificationRequest(BaseModel):
    text: str = Field(..., min_length=3, description="Article content, claim text, or social post")
    claim_id: Optional[str] = None
    article_id: Optional[str] = None
    image_path: Optional[str] = None
    platform: Optional[str] = "Web"
    language: Optional[str] = None

class AgentStepTrace(BaseModel):
    step: int
    action: str
    tool: str
    input_params: Dict[str, Any]
    observation: str
    thought: str

class VerificationVerdict(BaseModel):
    verification_id: str
    claim_text: str
    detected_language: str
    final_verdict: str = Field(..., description="SUPPORTED, CONTRADICTED, or UNVERIFIED")
    confidence: float = Field(..., description="Normalized confidence score between 0.0 and 1.0")
    confidence_percentage: float = Field(..., description="Normalized confidence as 0 - 100%")
    sub_scores: SubScores
    primary_claim: ClaimItem
    semantic_triple: SemanticTriple
    supporting_evidence_count: int
    contradicting_evidence_count: int
    best_evidence_score: float
    top_evidence: List[EvidenceCandidate]
    graph_info: Optional[GraphPathInfo] = None
    subgraph: Dict[str, Any] = {}
    reasoning_report: str
    agent_trace: List[AgentStepTrace] = []
    evaluation_benchmark_label: Optional[str] = None

class EvaluationMetric(BaseModel):
    category: str
    total_evaluated: int
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    supported_count: int
    contradicted_count: int
    average_confidence: float

class EvaluationResponse(BaseModel):
    dataset_name: str = "14_test.csv (10,000 samples)"
    total_samples: int
    metrics_summary: EvaluationMetric
    breakdown_by_category: Dict[str, Dict[str, float]]
    breakdown_by_language: Dict[str, Dict[str, float]]
    execution_time_seconds: float
