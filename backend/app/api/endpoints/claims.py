from fastapi import APIRouter, HTTPException
from typing import List
import logging
from app.schemas.claim_schema import (
    ClaimExtractionRequest,
    ClaimExtractionResponse,
    ClaimItem,
    SemanticTriple
)
from app.models.fasttext_lang import fasttext_lang_detector
from app.models.indictrans import indictrans_normalizer
from app.models.gemini_agent import gemini_agent

router = APIRouter(prefix="/claims", tags=["Claims"])
logger = logging.getLogger(__name__)

@router.post("/extract", response_model=ClaimExtractionResponse)
async def extract_claims_endpoint(request: ClaimExtractionRequest):
    """
    Extracts structured claims and semantic triples from input text using
    FastText language identification, IndicTrans2 script normalization,
    and Gemini 2.5 Flash structured claim decomposition.
    """
    try:
        # 1. Language Identification
        lang_res = fasttext_lang_detector.identify(request.text)
        detected_lang = request.language or lang_res["language_code"]

        # 2. Script Normalization & Translation
        trans_res = indictrans_normalizer.translate_to_english(request.text, source_lang=detected_lang)
        normalized_text = trans_res["translated_text"]

        # 3. Gemini Flash Structured Claim Extraction
        claims = gemini_agent.extract_structured_claims(normalized_text, language=detected_lang)

        # Build semantic triples
        triples = [
            SemanticTriple(
                subject=c.subject,
                predicate=c.predicate,
                object=c.object,
                event=c.event,
                event_date=c.event_date,
                location=c.location
            )
            for c in claims
        ]

        return ClaimExtractionResponse(
            original_text=request.text,
            detected_language=f"{lang_res['language_name']} ({detected_lang})",
            normalized_text=normalized_text,
            extracted_claims=claims,
            semantic_triples=triples,
            extraction_model="Google Gemini 2.5 Flash (Function Calling)"
        )
    except Exception as e:
        logger.error(f"Claim extraction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
