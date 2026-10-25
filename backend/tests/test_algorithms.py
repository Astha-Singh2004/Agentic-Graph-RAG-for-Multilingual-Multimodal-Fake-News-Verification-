import pytest
from app.algorithms.bm25_search import BM25SearchEngine
from app.algorithms.vector_search import VectorSearchEngine
from app.algorithms.graph_rag import GraphRAGEngine
from app.algorithms.decision_engine import DecisionEngine
from app.schemas.verdict_schema import SubScores

def test_bm25_search():
    engine = BM25SearchEngine()
    docs = [
        {"id": "doc1", "text": "Government announced public health advisory in Madhya Pradesh"},
        {"id": "doc2", "text": "Financial scheme subsidy launched for farmers in Maharashtra"},
        {"id": "doc3", "text": "Entertainment event film festival in Delhi"}
    ]
    engine.index_documents(docs, text_field="text")
    results = engine.search("public health advisory", top_k=2)
    assert len(results) > 0
    assert results[0]["id"] == "doc1"
    assert results[0]["score"] > 0.0

def test_graph_rag_dijkstra():
    graph_rag = GraphRAGEngine()
    evidence = graph_rag.find_relational_evidence(
        subject="Government / Institution",
        topic_or_object="Public Health Advisory",
        location="Madhya Pradesh"
    )
    assert "path_info" in evidence
    assert "relational_consistency" in evidence
    assert evidence["relational_consistency"] > 0.5
    assert len(evidence["path_info"]["shortest_path"]) >= 2
    assert "subgraph" in evidence
    assert len(evidence["subgraph"]["nodes"]) > 0

def test_decision_engine_supported():
    engine = DecisionEngine()
    sub_scores = SubScores(
        nli_entailment=0.92,
        nli_contradiction=0.03,
        nli_neutral=0.05,
        vector_similarity=0.88,
        bm25_relevance=0.85,
        source_reliability=0.95,
        temporal_consistency=0.90,
        graph_consistency=0.88,
        numeric_consistency=0.92
    )
    result = engine.compute_verdict(
        sub_scores=sub_scores,
        supporting_count=2,
        contradicting_count=0,
        claim_text="Government announced public health advisory in Madhya Pradesh.",
        top_evidence=[{"source": "Official News", "source_type": "OFFICIAL"}]
    )
    assert result["verdict"] == "SUPPORTED"
    assert result["confidence"] > 0.70
    assert "SUPPORTED" in result["reasoning_report"]

def test_decision_engine_contradicted():
    engine = DecisionEngine()
    sub_scores = SubScores(
        nli_entailment=0.04,
        nli_contradiction=0.91,
        nli_neutral=0.05,
        vector_similarity=0.45,
        bm25_relevance=0.50,
        source_reliability=0.90,
        temporal_consistency=0.85,
        graph_consistency=0.60,
        numeric_consistency=0.80
    )
    result = engine.compute_verdict(
        sub_scores=sub_scores,
        supporting_count=0,
        contradicting_count=2,
        claim_text="Viral claim: everyone gets immediate money.",
        top_evidence=[{"source": "Debunk Bureau", "source_type": "OFFICIAL"}]
    )
    assert result["verdict"] == "CONTRADICTED"
    assert result["confidence"] > 0.70
    assert "CONTRADICTED" in result["reasoning_report"]
