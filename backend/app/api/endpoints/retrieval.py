from fastapi import APIRouter, HTTPException
import logging
from app.schemas.evidence_schema import (
    HybridRetrievalRequest,
    HybridRetrievalResponse,
    EvidenceCandidate,
    GraphPathInfo
)
from app.algorithms.vector_search import vector_search_engine
from app.algorithms.graph_rag import graph_rag_engine

router = APIRouter(prefix="/retrieval", tags=["Retrieval"])
logger = logging.getLogger(__name__)

@router.post("/hybrid", response_model=HybridRetrievalResponse)
async def hybrid_retrieval_endpoint(request: HybridRetrievalRequest):
    """
    Executes Hybrid Retrieval combining:
    - BM25 Sparse Keyword Ranking
    - BGE-M3 Dense Semantic Vector Search
    - Neo4j Graph RAG Shortest Path & BFS Context
    """
    try:
        # 1. Sparse + Dense Retrieval
        candidates_raw = vector_search_engine.hybrid_search(
            query=request.claim_text,
            top_k=request.top_k
        )

        candidates = [
            EvidenceCandidate(
                evidence_id=c["evidence_id"],
                claim_id=c.get("claim_id"),
                article_id=c.get("article_id"),
                evidence_text=c["evidence_text"],
                source=c.get("source", "Verified News Wire"),
                source_type=c.get("source_type", "OFFICIAL"),
                bm25_score=c["bm25_score"],
                vector_score=c["vector_score"],
                source_reliability=c["source_reliability"],
                temporal_score=c["temporal_score"],
                evidence_score=c["evidence_score"]
            )
            for c in candidates_raw
        ]

        # 2. Graph RAG Traversal
        graph_info = None
        subgraph = {"nodes": [], "links": []}
        if request.enable_graph_rag:
            g_res = graph_rag_engine.find_relational_evidence(
                subject=request.subject,
                topic_or_object=request.object,
                location=request.location
            )
            pi = g_res.get("path_info", {})
            if pi:
                graph_info = GraphPathInfo(
                    source_entity=pi.get("source_entity", "Government / Institution"),
                    target_entity=pi.get("target_entity", "India-wide"),
                    shortest_path=pi.get("shortest_path", []),
                    path_length=pi.get("path_length", 1),
                    hops=pi.get("hops", 1),
                    weight=pi.get("weight", 1.0),
                    relational_consistency=pi.get("relational_consistency", 0.8)
                )
            subgraph = g_res.get("subgraph", subgraph)

        return HybridRetrievalResponse(
            query=request.claim_text,
            top_candidates=candidates,
            graph_context=graph_info,
            subgraph_nodes=subgraph.get("nodes", []),
            subgraph_edges=subgraph.get("links", []),
            retrieval_metadata={
                "strategy": "BM25 Sparse + BGE-M3 Dense + Graph RAG Dijkstra",
                "total_candidates_scanned": len(candidates),
                "graph_consistency": graph_info.relational_consistency if graph_info else 0.8
            }
        )
    except Exception as e:
        logger.error(f"Hybrid retrieval failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
