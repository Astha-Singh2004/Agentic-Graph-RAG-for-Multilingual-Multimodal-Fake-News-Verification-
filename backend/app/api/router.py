from fastapi import APIRouter
from app.api.endpoints.claims import router as claims_router
from app.api.endpoints.retrieval import router as retrieval_router
from app.api.endpoints.verification import router as verification_router
from app.api.endpoints.evaluate import router as evaluate_router
from app.api.endpoints.analytics import router as analytics_router

api_router = APIRouter()
api_router.include_router(verification_router)
api_router.include_router(claims_router)
api_router.include_router(retrieval_router)
api_router.include_router(evaluate_router)
api_router.include_router(analytics_router)
