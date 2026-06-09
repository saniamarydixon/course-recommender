import numpy as np
from sklearn.decomposition import TruncatedSVD

from app.models.user import User
from app.models.course import Course
from app.models.interaction import Interaction

class CollaborativeRecommender:
    def __init__(self, db_session):
        self.db = db_session
        self.user_ids = []
        self.course_ids = []
        self.user_to_idx = {}
        self.course_to_idx = {}
        self.predicted_ratings = None

    def fit(self):
        """Build user-item matrix and apply SVD"""
        # Fetch all user and course IDs
        users = self.db.query(User.id).all()
        courses = self.db.query(Course.id).all()
        
        self.user_ids = [u[0] for u in users]
        self.course_ids = [c[0] for c in courses]
        
        if not self.user_ids or not self.course_ids:
            self.predicted_ratings = np.array([[]])
            return

        self.user_to_idx = {u_id: i for i, u_id in enumerate(self.user_ids)}
        self.course_to_idx = {c_id: i for i, c_id in enumerate(self.course_ids)}
        
        # Initialize rating matrix
        R = np.zeros((len(self.user_ids), len(self.course_ids)))
        
        # Fetch all user-course interactions
        interactions = self.db.query(Interaction).all()
        for interaction in interactions:
            u_idx = self.user_to_idx.get(interaction.user_id)
            c_idx = self.course_to_idx.get(interaction.course_id)
            
            if u_idx is not None and c_idx is not None:
                # Map interaction type and rating to rating scores (1.0 to 5.0 scale)
                val = 3.0
                if interaction.interaction_type == 'rating' and interaction.rating:
                    val = interaction.rating
                elif interaction.interaction_type == 'completion':
                    val = 5.0
                elif interaction.interaction_type == 'enrollment':
                    val = 4.0
                elif interaction.interaction_type == 'view':
                    val = 2.0
                
                R[u_idx, c_idx] = max(R[u_idx, c_idx], val)

        # Apply SVD if we have enough users and courses
        # TruncatedSVD requires n_components < min(R.shape)
        n_components = min(20, R.shape[0] - 1, R.shape[1] - 1)
        
        if n_components >= 1:
            try:
                svd = TruncatedSVD(n_components=n_components, random_state=42)
                R_reduced = svd.fit_transform(R)
                self.predicted_ratings = svd.inverse_transform(R_reduced)
            except Exception as e:
                print(f"Error applying SVD: {e}. Falling back to default user-item matrix.")
                self.predicted_ratings = R.copy()
        else:
            # Fallback when matrix is too small for SVD
            self.predicted_ratings = R.copy()

    def get_recommendations(self, user_id, n=10):
        """Get collaborative filtering recommendations"""
        # If user not in rating matrix: fallback to popularity
        if user_id not in self.user_to_idx:
            popular = self.db.query(Course.id).order_by(Course.enrollment_count.desc()).limit(n).all()
            return [p[0] for p in popular]

        u_idx = self.user_to_idx[user_id]
        user_ratings = self.predicted_ratings[u_idx]
        
        # Sort courses by predicted rating in descending order
        sorted_course_indices = np.argsort(user_ratings)[::-1]
        
        # Fetch user's interactions to filter out already enrolled/rated courses
        user_interactions = (
            self.db.query(Interaction)
            .filter(
                Interaction.user_id == user_id,
                Interaction.interaction_type.in_(['enrollment', 'completion', 'rating'])
            )
            .all()
        )
        interacted_course_ids = set(int(i.course_id) for i in user_interactions)
        
        recommendations = []
        for idx in sorted_course_indices:
            c_id = self.course_ids[idx]
            # Recommend courses that user has NOT interacted with
            if c_id not in interacted_course_ids:
                recommendations.append(c_id)
                if len(recommendations) == n:
                    break
                    
        # If we couldn't get enough recommendations, backfill with popular ones
        if len(recommendations) < n:
            popular = self.db.query(Course.id).order_by(Course.enrollment_count.desc()).all()
            for p in popular:
                p_id = p[0]
                if p_id not in interacted_course_ids and p_id not in recommendations:
                    recommendations.append(p_id)
                    if len(recommendations) == n:
                        break
                        
        return recommendations
