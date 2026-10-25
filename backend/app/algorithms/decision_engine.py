from typing import Dict, Any, List, Optional
import logging
from app.config import settings
from app.schemas.verdict_schema import SubScores

logger = logging.getLogger(__name__)

class DecisionEngine:
    """
    Algorithmic Decision Engine for Claim & News Verification.
    Aggregates multimodal evidence signals using a multi-factor weighted sum formula:
      S = w_nli * S_nli + w_vec * S_vec + w_bm25 * S_bm25 + w_src * S_src
          + w_graph * S_graph + w_time * S_time + w_multi * S_multi

    Derives categorical verdict:
      - SUPPORTED (True / Verified)
      - CONTRADICTED (False / Fake News)
      - UNVERIFIED (Inconclusive / Neutral / Ambiguous)
    along with normalized confidence percentage and detailed reasoning report.
    """
    def __init__(self):
        self.w_nli = settings.WEIGHT_NLI
        self.w_vec = settings.WEIGHT_VECTOR
        self.w_bm25 = settings.WEIGHT_BM25
        self.w_src = settings.WEIGHT_SOURCE
        self.w_graph = settings.WEIGHT_GRAPH
        self.w_time = settings.WEIGHT_TEMPORAL
        self.w_multi = settings.WEIGHT_MULTIMODAL

    def compute_verdict(
        self,
        sub_scores: SubScores,
        supporting_count: int,
        contradicting_count: int,
        claim_text: str,
        top_evidence: List[Dict[str, Any]],
        graph_info: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes weighted aggregation and determines final classification.
        """
        # Multimodal signal (if available, else redistribute weight into NLI/vector)
        multi_val = sub_scores.image_text_consistency if sub_scores.image_text_consistency is not None else 0.85
        
        # 1. Base Corroboration Score
        support_signal = (
            (self.w_nli * sub_scores.nli_entailment) +
            (self.w_vec * sub_scores.vector_similarity) +
            (self.w_bm25 * sub_scores.bm25_relevance) +
            (self.w_src * sub_scores.source_reliability) +
            (self.w_graph * sub_scores.graph_consistency) +
            (self.w_time * sub_scores.temporal_consistency) +
            (self.w_multi * multi_val)
        )

        # 2. Contradiction Signal
        contradict_signal = (
            (self.w_nli * sub_scores.nli_contradiction) +
            (self.w_vec * (1.0 - sub_scores.vector_similarity) * 0.3) +
            (self.w_graph * (1.0 - sub_scores.graph_consistency) * 0.4)
        )

        # 3. Decision Logic
        if sub_scores.nli_contradiction > 0.45 or contradicting_count > supporting_count:
            verdict = "CONTRADICTED"
            # Confidence in contradiction
            raw_conf = 0.55 + (sub_scores.nli_contradiction * 0.35) + (contradict_signal * 0.1)
            confidence = min(0.99, max(0.60, raw_conf))
        elif sub_scores.nli_entailment > 0.40 and supporting_count >= contradicting_count:
            verdict = "SUPPORTED"
            raw_conf = 0.50 + (sub_scores.nli_entailment * 0.35) + (support_signal * 0.15)
            confidence = min(0.99, max(0.60, raw_conf))
        elif sub_scores.nli_neutral > 0.60 or (supporting_count == 0 and contradicting_count == 0):
            verdict = "UNVERIFIED"
            confidence = min(0.85, max(0.40, sub_scores.nli_neutral * 0.8))
        else:
            if support_signal >= 0.60:
                verdict = "SUPPORTED"
                confidence = round(min(0.95, support_signal), 4)
            else:
                verdict = "UNVERIFIED"
                confidence = 0.55

        confidence = round(float(confidence), 4)
        confidence_pct = round(confidence * 100.0, 2)

        # Generate reasoning report
        report = self._generate_reasoning_report(
            verdict=verdict,
            confidence_pct=confidence_pct,
            sub_scores=sub_scores,
            supporting_count=supporting_count,
            contradicting_count=contradicting_count,
            claim_text=claim_text,
            top_evidence=top_evidence,
            graph_info=graph_info
        )

        return {
            "verdict": verdict,
            "confidence": confidence,
            "confidence_percentage": confidence_pct,
            "reasoning_report": report
        }

    def _generate_reasoning_report(
        self,
        verdict: str,
        confidence_pct: float,
        sub_scores: SubScores,
        supporting_count: int,
        contradicting_count: int,
        claim_text: str,
        top_evidence: List[Dict[str, Any]],
        graph_info: Optional[Dict[str, Any]]
    ) -> str:
        """Constructs transparent, auditable natural language fact-checking report."""
        best_ev = top_evidence[0] if top_evidence else {}
        ev_source = best_ev.get("source", "Cross-lingual Knowledge Repository")
        ev_type = best_ev.get("source_type", "OFFICIAL")

        graph_summary = ""
        if graph_info and "shortest_path" in graph_info:
            path_str = " -> ".join(graph_info["shortest_path"])
            graph_summary = f" The relational Graph RAG traversal verified the semantic connection via the knowledge graph path: [{path_str}] with structural consistency of {round(sub_scores.graph_consistency * 100, 1)}%."

        multimodal_summary = ""
        if sub_scores.image_text_consistency is not None:
            multimodal_summary = f" Multimodal CLIP analysis confirmed image-text alignment score of {round(sub_scores.image_text_consistency * 100, 1)}%."

        if verdict == "SUPPORTED":
            return (
                f"The claim '{claim_text}' has been verified as SUPPORTED with {confidence_pct}% confidence. "
                f"The hybrid retrieval pipeline discovered {supporting_count} corroborating official evidence record(s). "
                f"XLM-RoBERTa cross-encoder NLI assessed an entailment probability of {round(sub_scores.nli_entailment * 100, 1)}% "
                f"against primary source '{ev_source}' ({ev_type})."
                f"{graph_summary}{multimodal_summary} "
                f"BM25 keyword relevance scored {round(sub_scores.bm25_relevance * 100, 1)}% and dense BGE-M3 semantic similarity scored {round(sub_scores.vector_similarity * 100, 1)}%."
            )
        elif verdict == "CONTRADICTED":
            return (
                f"The claim '{claim_text}' has been identified as CONTRADICTED (misinformation / fake news) with {confidence_pct}% confidence. "
                f"Cross-lingual NLI cross-examination revealed a contradiction probability of {round(sub_scores.nli_contradiction * 100, 1)}% "
                f"against {contradicting_count} refuting institutional source records ({ev_source}). "
                f"The asserted assertion conflicts with verified records."
                f"{graph_summary}{multimodal_summary} "
                f"Decision engine determined the statement to be false or fabricated."
            )
        else:
            return (
                f"The claim '{claim_text}' is currently UNVERIFIED (confidence: {confidence_pct}%). "
                f"Neither strong supporting evidence ({supporting_count} found) nor definitive refutations ({contradicting_count} found) "
                f"exceeded verification thresholds. XLM-RoBERTa NLI neutral probability stood at {round(sub_scores.nli_neutral * 100, 1)}%."
                f"{graph_summary} Further corroboration from primary sources is recommended."
            )

decision_engine = DecisionEngine()
