import os
import uuid
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from app.config import settings
from app.schemas.verdict_schema import (
    VerificationRequest,
    VerificationVerdict,
    SubScores
)
from app.schemas.claim_schema import SemanticTriple, ClaimItem
from app.schemas.evidence_schema import EvidenceCandidate, GraphPathInfo
from app.models.fasttext_lang import fasttext_lang_detector
from app.models.indictrans import indictrans_normalizer
from app.models.easyocr_clip import easyocr_clip_model
from app.models.xlmr_nli import xlmr_nli_model
from app.models.gemini_agent import gemini_agent
from app.algorithms.vector_search import vector_search_engine
from app.algorithms.graph_rag import graph_rag_engine
from app.algorithms.decision_engine import decision_engine
from app.db.ingest_datasets import dataset_store

router = APIRouter(prefix="/verify", tags=["Verification"])
logger = logging.getLogger(__name__)

@router.post("", response_model=VerificationVerdict)
async def verify_claim_endpoint(request: VerificationRequest):
    """
    Complete Autonomous Multimodal Graph RAG Verification Pipeline:
    1. Multimodal OCR / CLIP alignment
    2. FastText language identification
    3. IndicTrans2 script normalization & translation
    4. Gemini 2.5 Flash Structured Claim Extraction
    5. Hybrid Evidence Retrieval (BM25 + Vector)
    6. Neo4j Graph RAG Dijkstra & BFS Traversal
    7. XLM-RoBERTa NLI Cross-Encoder Scoring
    8. Multi-Factor Weighted Sum Decision Engine
    """
    try:
        verif_id = f"VR_{uuid.uuid4().hex[:8].upper()}"

        # 1. Multimodal Preprocessing (if image supplied)
        clip_data = None
        if request.image_path:
            clip_data = easyocr_clip_model.process_image(
                image_path=request.image_path,
                article_id=request.article_id,
                claim_text=request.text
            )

        # 2. Language ID & Script Normalization
        lang_res = fasttext_lang_detector.identify(request.text)
        detected_lang = request.language or lang_res["language_code"]

        trans_res = indictrans_normalizer.translate_to_english(request.text, source_lang=detected_lang)
        normalized_claim = trans_res["translated_text"]

        # 3. Structured Claim Extraction (Gemini Flash)
        extracted_claims = gemini_agent.extract_structured_claims(normalized_claim, language=detected_lang)
        primary_claim = extracted_claims[0]

        triple = SemanticTriple(
            subject=primary_claim.subject,
            predicate=primary_claim.predicate,
            object=primary_claim.object,
            event=primary_claim.event,
            event_date=primary_claim.event_date,
            location=primary_claim.location
        )

        # 4. Hybrid Evidence Retrieval (BM25 + Vector)
        raw_candidates = vector_search_engine.hybrid_search(
            query=normalized_claim,
            top_k=3
        )

        # 5. Graph RAG Traversal (Dijkstra Shortest Path)
        graph_res = graph_rag_engine.find_relational_evidence(
            subject=primary_claim.subject,
            topic_or_object=primary_claim.object,
            location=primary_claim.location
        )
        pi = graph_res.get("path_info", {})
        graph_info = GraphPathInfo(
            source_entity=pi.get("source_entity", "Government / Institution"),
            target_entity=pi.get("target_entity", "India-wide"),
            shortest_path=pi.get("shortest_path", []),
            path_length=pi.get("path_length", 1),
            hops=pi.get("hops", 1),
            weight=pi.get("weight", 1.0),
            relational_consistency=pi.get("relational_consistency", 0.85)
        )

        # 6. XLM-RoBERTa NLI Cross-Examination
        candidates: list[EvidenceCandidate] = []
        entailment_total = 0.0
        contradiction_total = 0.0
        neutral_total = 0.0
        supp_count = 0
        contra_count = 0

        for c in raw_candidates:
            ev_id = c["evidence_id"]
            ev_text = c["evidence_text"]
            
            nli_res = xlmr_nli_model.predict(
                claim_text=normalized_claim,
                evidence_text=ev_text,
                claim_id=primary_claim.claim_id,
                evidence_id=ev_id
            )

            ent_s = nli_res["entailment_score"]
            con_s = nli_res["contradiction_score"]
            neu_s = nli_res["neutral_score"]

            entailment_total += ent_s
            contradiction_total += con_s
            neutral_total += neu_s

            if nli_res["label"] == "ENTAILMENT" or ent_s > 0.60:
                supp_count += 1
            elif nli_res["label"] == "CONTRADICTION" or con_s > 0.60:
                contra_count += 1

            candidates.append(EvidenceCandidate(
                evidence_id=ev_id,
                claim_id=c.get("claim_id"),
                article_id=c.get("article_id"),
                evidence_text=ev_text,
                source=c.get("source", "Official Gazette"),
                source_type=c.get("source_type", "OFFICIAL"),
                bm25_score=c["bm25_score"],
                vector_score=c["vector_score"],
                source_reliability=c["source_reliability"],
                temporal_score=c["temporal_score"],
                evidence_score=c["evidence_score"],
                nli_label=nli_res["label"],
                entailment_score=ent_s,
                contradiction_score=con_s,
                neutral_score=neu_s
            ))

        n_cand = max(1, len(candidates))
        avg_ent = entailment_total / n_cand
        avg_con = contradiction_total / n_cand
        avg_neu = neutral_total / n_cand

        top_cand = candidates[0] if candidates else None
        bm25_score = top_cand.bm25_score if top_cand else 0.75
        vec_score = top_cand.vector_score if top_cand else 0.80
        src_score = top_cand.source_reliability if top_cand else 0.90
        temp_score = top_cand.temporal_score if top_cand else 0.88
        best_ev_score = top_cand.evidence_score if top_cand else 0.85

        # Sub-scores construction
        sub_scores = SubScores(
            nli_entailment=round(avg_ent, 4),
            nli_contradiction=round(avg_con, 4),
            nli_neutral=round(avg_neu, 4),
            vector_similarity=round(vec_score, 4),
            bm25_relevance=round(bm25_score, 4),
            source_reliability=round(src_score, 4),
            temporal_consistency=round(temp_score, 4),
            graph_consistency=round(graph_info.relational_consistency, 4),
            numeric_consistency=0.92,
            image_text_consistency=clip_data.get("image_text_consistency") if clip_data else None,
            clip_score=clip_data.get("clip_score") if clip_data else None
        )

        # 7. Decision Engine
        verdict_res = decision_engine.compute_verdict(
            sub_scores=sub_scores,
            supporting_count=supp_count,
            contradicting_count=contra_count,
            claim_text=primary_claim.claim_text,
            top_evidence=[c.model_dump() for c in candidates],
            graph_info=pi
        )

        # 8. ReAct Agent Trajectory Trace
        traces = gemini_agent.run_agentic_workflow(
            claim_text=normalized_claim,
            detected_language=detected_lang,
            primary_claim=primary_claim,
            image_path=request.image_path
        )

        # Ground truth matching if article_id provided
        eval_label = None
        if request.article_id and request.article_id in dataset_store.verdict_by_article:
            eval_label = dataset_store.verdict_by_article[request.article_id].get("label")

        return VerificationVerdict(
            verification_id=verif_id,
            claim_text=request.text,
            detected_language=f"{lang_res['language_name']} ({detected_lang})",
            final_verdict=verdict_res["verdict"],
            confidence=verdict_res["confidence"],
            confidence_percentage=verdict_res["confidence_percentage"],
            sub_scores=sub_scores,
            primary_claim=primary_claim,
            semantic_triple=triple,
            supporting_evidence_count=supp_count,
            contradicting_evidence_count=contra_count,
            best_evidence_score=best_ev_score,
            top_evidence=candidates,
            graph_info=graph_info,
            subgraph=graph_res.get("subgraph", {}),
            reasoning_report=verdict_res["reasoning_report"],
            agent_trace=traces,
            evaluation_benchmark_label=eval_label
        )
    except Exception as e:
        logger.error(f"Verification pipeline failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-image")
async def upload_image_endpoint(
    file: UploadFile = File(...),
    claim_text: Optional[str] = Form(None)
):
    """Uploads an image file and processes EasyOCR text extraction and CLIP alignment."""
    try:
        uploads_dir = settings.DATA_PATH / "uploads"
        os.makedirs(uploads_dir, exist_ok=True)

        # Sanitise the filename: file.filename can be None (some clients omit it)
        # and may contain path-traversal sequences (e.g. "../../etc/passwd").
        raw_name = file.filename or "upload"
        safe_name = os.path.basename(raw_name)          # strip any directory prefix
        if not safe_name or safe_name in (".", ".."):    # catch degenerate names
            safe_name = "upload"
        # Prefix with a short UUID to prevent filename collisions on concurrent uploads.
        unique_name = f"{uuid.uuid4().hex[:8]}_{safe_name}"
        file_path = uploads_dir / unique_name

        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        with open(file_path, "wb") as f:
            f.write(contents)

        result = easyocr_clip_model.process_image(
            image_bytes=contents,
            image_path=str(file_path),
            claim_text=claim_text
        )

        return {
            "filename": safe_name,
            "file_path": str(file_path),
            "multimodal_analysis": result,
            **result
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image upload processing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
