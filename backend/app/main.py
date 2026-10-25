import os
os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.router import api_router
from app.algorithms.bm25_search import bm25_engine
from app.db.ingest_datasets import dataset_store
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle events."""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}...")
    if dataset_store.evidence_sample:
        logger.info(f"Indexing {len(dataset_store.evidence_sample)} evidence candidates into BM25...")
        bm25_engine.index_documents(dataset_store.evidence_sample, text_field="evidence_text")
    else:
        logger.warning("No evidence records available to index into BM25.")

    yield
    logger.info("Shutting down fact-verification backend.")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Cross-Lingual Multimodal Fake News and Claim Verification System using Agentic Graph RAG",
    lifespan=lifespan
)

# CORS Configuration
origins = [
    settings.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"  # Allow flexible local dev access
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Router
app.include_router(api_router, prefix="/api")

@app.get("/", tags=["System"])
async def root():
    return {
        "status": "online",
        "system": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs_url": "/docs",
        "api_prefix": "/api"
    }

@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "loaded_evidence_count": len(dataset_store.evidence_sample),
        "loaded_articles_count": len(dataset_store.articles_sample),
        "graph_nodes": dataset_store.stats.get("entities", 29),
        "vector_store_documents": len(dataset_store.evidence_sample)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
