from app.models.course import Course

class PopularityRecommender:
    def __init__(self, db_session):
        self.db = db_session

    def get_popular_courses(self, n=10):
        """Get most popular courses by enrollment count"""
        popular = (
            self.db.query(Course.id)
            .order_by(Course.enrollment_count.desc())
            .limit(n)
            .all()
        )
        return [c[0] for c in popular]
