from sqlalchemy.orm import Session, joinedload

from app.ml.recommender import CourseRecommender
from app.models.recommendation import Recommendation
from app.models.user import User
from app.schemas.recommendation import RecommendationRequest


class RecommendationService:
    def __init__(self, db: Session):
        self.db = db
        self.recommender = CourseRecommender(db)

    def get_user_recommendations(
        self, user: User, params: RecommendationRequest
    ) -> list[Recommendation]:
        return self.recommender.generate(user, params)

    def get_history(self, user_id: int, skip: int = 0, limit: int = 50) -> list[Recommendation]:
        return (
            self.db.query(Recommendation)
            .options(joinedload(Recommendation.course))
            .filter(Recommendation.user_id == user_id)
            .order_by(Recommendation.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
