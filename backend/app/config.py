import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

load_dotenv(BASE_DIR / ".env")

class Settings(BaseModel):
    APP_NAME: str = "Cross-Lingual Multimodal Fact Verification System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Gemini Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    
    # Neo4j Graph Database
    NEO4J_URI: str = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    NEO4J_USER: str = os.getenv("NEO4J_USER", "neo4j")
    NEO4J_PASSWORD: str = os.getenv("NEO4J_PASSWORD", "password")
    USE_EMBEDDED_GRAPH: bool = os.getenv("USE_EMBEDDED_GRAPH", "True").lower() in ("true", "1")
    
    # Vector Database
    QDRANT_URL: str = os.getenv("QDRANT_URL", "http://localhost:6333")
    USE_EMBEDDED_VECTOR: bool = os.getenv("USE_EMBEDDED_VECTOR", "True").lower() in ("true", "1")
    
    # Datasets
    DATA_PATH: Path = DATA_DIR
    
    # CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # Decision Engine Weights (Sum = 1.0)
    WEIGHT_NLI: float = 0.35
    WEIGHT_VECTOR: float = 0.20
    WEIGHT_BM25: float = 0.15
    WEIGHT_SOURCE: float = 0.10
    WEIGHT_GRAPH: float = 0.10
    WEIGHT_TEMPORAL: float = 0.05
    WEIGHT_MULTIMODAL: float = 0.05
    
    # Verdict Thresholds
    THRESHOLD_SUPPORTED: float = 0.65
    THRESHOLD_CONTRADICTED: float = 0.65
    THRESHOLD_NEUTRAL_MARGIN: float = 0.15

settings = Settings()
