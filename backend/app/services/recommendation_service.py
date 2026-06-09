from sqlalchemy.orm import Session, joinedload

from app.models.recommendation import Recommendation
from app.models.course import Course
from app.models.user import User
from app.schemas.recommendation import RecommendationRequest
from app.ml.hybrid import HybridRecommender

class RecommendationService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_recommendations(
        self, user: User, params: RecommendationRequest, algorithm: str = "hybrid"
    ) -> list[Recommendation]:
        # Initialize and fit ML recommenders
        hybrid_rec = HybridRecommender(self.db)
        hybrid_rec.fit()
        
        # Get list of valid course IDs matching category and level filters
        query = self.db.query(Course.id)
        if params.categories:
            # Handle list of categories
            query = query.filter(Course.category.in_(params.categories))
        if params.level:
            query = query.filter(Course.level == params.level)
        valid_course_ids = {c[0] for c in query.all()}

        # Generate candidates from chosen algorithm
        # We request all courses (e.g. limit=100) to ensure we have enough matches after filtering
        if algorithm == "content":
            candidate_ids = hybrid_rec.content.get_recommendations_for_user(user.id, n=100)
            recs_data = []
            for i, cid in enumerate(candidate_ids):
                score = 1.0 - i / len(candidate_ids) if candidate_ids else 1.0
                reason = hybrid_rec._get_reason(cid, user.id, candidate_ids, [], [])
                recs_data.append({'course_id': cid, 'score': score, 'reason': reason})
        elif algorithm == "collaborative":
            candidate_ids = hybrid_rec.collaborative.get_recommendations(user.id, n=100)
            recs_data = []
            for i, cid in enumerate(candidate_ids):
                score = 1.0 - i / len(candidate_ids) if candidate_ids else 1.0
                reason = hybrid_rec._get_reason(cid, user.id, [], candidate_ids, [])
                recs_data.append({'course_id': cid, 'score': score, 'reason': reason})
        else: # hybrid
            # Returns list of dicts with course_id, score, reason
            recs_data = hybrid_rec.get_recommendations(user.id, n=100)

        # Filter candidates and limit to requested size
        filtered_recs = []
        for rec in recs_data:
            if rec['course_id'] in valid_course_ids:
                filtered_recs.append(rec)
                if len(filtered_recs) == params.limit:
                    break

        # Save recommendations to database
        db_recommendations = []
        for rec in filtered_recs:
            db_rec = Recommendation(
                user_id=user.id,
                course_id=rec['course_id'],
                score=rec['score'],
                reason=rec['reason']
            )
            # Tag transient field for response mapping
            db_rec.algorithm_used = algorithm
            self.db.add(db_rec)
            db_recommendations.append(db_rec)

        self.db.commit()

        # Refresh and load relationships
        for db_rec in db_recommendations:
            self.db.refresh(db_rec)
            # Load course relationship explicitly
            db_rec.course = self.db.query(Course).filter(Course.id == db_rec.course_id).first()

        return db_recommendations

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
