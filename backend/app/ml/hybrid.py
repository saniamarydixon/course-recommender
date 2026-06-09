from app.ml.content_based import ContentBasedRecommender
from app.ml.collaborative import CollaborativeRecommender
from app.ml.popularity import PopularityRecommender
from app.models.course import Course
from app.models.user import User

class HybridRecommender:
    def __init__(self, db_session):
        self.db = db_session
        self.content = ContentBasedRecommender(db_session)
        self.collaborative = CollaborativeRecommender(db_session)
        self.popularity = PopularityRecommender(db_session)

    def fit(self):
        """Fit both content-based and collaborative models"""
        self.content.fit()
        self.collaborative.fit()

    def get_recommendations(self, user_id, n=10):
        """Get hybrid recommendations with scores and reasoning"""
        content_recs = self.content.get_recommendations_for_user(user_id, n=20)
        collab_recs = self.collaborative.get_recommendations(user_id, n=20)
        popular_recs = self.popularity.get_popular_courses(n=10)

        scores = {}
        
        # Add content-based scores (50% weight)
        for i, course_id in enumerate(content_recs):
            scores[course_id] = scores.get(course_id, 0.0) + 0.5 * (1.0 - i / 20.0)

        # Add collaborative scores (30% weight)
        for i, course_id in enumerate(collab_recs):
            scores[course_id] = scores.get(course_id, 0.0) + 0.3 * (1.0 - i / 20.0)

        # Add popularity scores (20% weight)
        for i, course_id in enumerate(popular_recs):
            scores[course_id] = scores.get(course_id, 0.0) + 0.2 * (1.0 - i / 10.0)

        # Sort recommendations by final score descending
        sorted_recs = sorted(scores.items(), key=lambda x: x[1], reverse=True)

        results = []
        for course_id, score in sorted_recs[:n]:
            # Generate personalized reasoning
            reason = self._get_reason(course_id, user_id, content_recs, collab_recs, popular_recs)
            
            results.append({
                'course_id': course_id,
                'score': float(round(score, 4)),
                'reason': reason
            })
            
        return results

    def _get_reason(self, course_id, user_id, content_recs, collab_recs, popular_recs):
        """Build context-aware reasoning for the recommended course"""
        course = self.db.query(Course).filter(Course.id == course_id).first()
        if not course:
            return "Highly recommended for you"

        user = self.db.query(User).filter(User.id == user_id).first()
        
        # 1. Check user interests match
        if user and user.interests and course.category.lower() in user.interests.lower():
            return f"Matches your profile interest in {course.category}"

        # 2. Check algorithm source contributions
        is_content = course_id in content_recs
        is_collab = course_id in collab_recs
        is_popular = course_id in popular_recs

        if is_content and is_collab:
            return f"Based on your interest in {course.category} and similar students' ratings"
        elif is_content:
            return f"Similar to other {course.level} courses you've checked out"
        elif is_collab:
            return "Recommended based on profiles of similar active learners"
        elif is_popular:
            return f"A top trending {course.level} course in {course.category}"
            
        return f"Highly rated course in {course.category}"
