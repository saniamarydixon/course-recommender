"""
ML-based course recommendation engine.

Placeholder implementation using rule-based scoring.
Replace with scikit-learn models (collaborative filtering, content-based) as data grows.
"""

from sqlalchemy.orm import Session

from app.models.course import Course
from app.models.recommendation import Recommendation
from app.models.user import User
from app.schemas.recommendation import RecommendationRequest


class CourseRecommender:
    def __init__(self, db: Session):
        self.db = db

    def generate(self, user: User, params: RecommendationRequest) -> list[Recommendation]:
        query = self.db.query(Course)
        if params.categories:
            query = query.filter(Course.category.in_(params.categories))
        if params.level:
            query = query.filter(Course.level == params.level)

        courses = query.order_by(Course.rating.desc()).limit(params.limit).all()
        recommendations: list[Recommendation] = []

        for rank, course in enumerate(courses):
            score = self._compute_score(user, course, rank)
            reason = self._build_reason(user, course)
            rec = Recommendation(
                user_id=user.id,
                course_id=course.id,
                score=score,
                reason=reason,
            )
            self.db.add(rec)
            recommendations.append(rec)

        self.db.commit()
        for rec, course in zip(recommendations, courses):
            self.db.refresh(rec)
            rec.course = course

        return recommendations

    def _compute_score(self, user: User, course: Course, rank: int) -> float:
        base_score = course.rating / 5.0
        interest_boost = 0.0
        if user.interests and course.category.lower() in user.interests.lower():
            interest_boost = 0.2
        rank_penalty = rank * 0.02
        return round(min(1.0, base_score + interest_boost - rank_penalty), 4)

    def _build_reason(self, user: User, course: Course) -> str:
        if user.interests and course.category.lower() in user.interests.lower():
            return f"Matches your interest in {course.category}"
        return f"Highly rated {course.level} course in {course.category}"
