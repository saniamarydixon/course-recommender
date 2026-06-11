from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from app.services.recommendation_service import RecommendationService
from app.utils.dependencies import get_current_user

router = APIRouter()


@router.get("/test")
def recommendations_test():
    return {"status": "ok", "module": "recommendations"}


@router.post("/generate", response_model=list[RecommendationResponse])
def generate_recommendations(
    params: RecommendationRequest,
    algorithm: str = "hybrid",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    recommendations = RecommendationService(db).get_user_recommendations(current_user, params, algorithm)
    
    return recommendations



@router.get("/history", response_model=list[RecommendationResponse])
def get_recommendation_history(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return RecommendationService(db).get_history(current_user.id, skip=skip, limit=limit)
