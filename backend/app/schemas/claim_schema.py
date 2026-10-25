from typing import Optional, List
from pydantic import BaseModel, Field

class SemanticTriple(BaseModel):
    subject: str = Field(..., description="Subject of the claim or entity performing action")
    predicate: str = Field(..., description="Action, relation, or assertion made")
    object: str = Field(..., description="Object, recipient, or target concept")
    event: Optional[str] = Field("INFORMATION_EVENT", description="Event category or descriptor")
    event_date: Optional[str] = Field(None, description="Extracted or inferred date of the event")
    location: Optional[str] = Field(None, description="Geographic location or state involved")

class ClaimItem(BaseModel):
    claim_id: Optional[str] = None
    article_id: Optional[str] = None
    claim_text: str
    language: str = "en"
    subject: str = "General Entity"
    predicate: str = "ASSERTS"
    object: str = "Statement"
    event: str = "INFORMATION_EVENT"
    event_date: Optional[str] = None
    location: Optional[str] = None
    claim_type: str = "PRIMARY"
    label: Optional[str] = None
    confidence: float = 0.90

class ClaimExtractionRequest(BaseModel):
    text: str = Field(..., min_length=3, description="Raw news article, social post, or claim statement")
    language: Optional[str] = Field(None, description="ISO-639-1 language code if known (e.g. 'hi', 'en', 'mr')")
    source_url: Optional[str] = Field(None, description="URL or source of the claim")
    has_image: bool = Field(False, description="Whether media contains an attached image")

class ClaimExtractionResponse(BaseModel):
    original_text: str
    detected_language: str
    normalized_text: str
    extracted_claims: List[ClaimItem]
    semantic_triples: List[SemanticTriple]
    extraction_model: str = "Gemini 2.5 Flash Function Calling"
