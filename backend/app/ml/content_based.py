import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.models.course import Course
from app.models.interaction import Interaction
from app.ml.preprocessor import combine_course_features

class ContentBasedRecommender:
    def __init__(self, db_session):
        self.db = db_session
        self.tfidf = None
        self.cosine_sim = None
        self.course_indices = {}
        self.course_ids_list = []

    def fit(self):
        """Build TF-IDF matrix from all courses"""
        courses = self.db.query(Course).all()
        if not courses:
            self.cosine_sim = np.array([[]])
            return

        self.course_ids_list = [c.id for c in courses]
        self.course_indices = {c.id: i for i, c in enumerate(courses)}
        
        # Combine features and preprocess
        combined_texts = [combine_course_features(c) for c in courses]
        
        # Calculate TF-IDF matrix
        self.tfidf = TfidfVectorizer(stop_words='english', max_features=5000)
        tfidf_matrix = self.tfidf.fit_transform(combined_texts)
        
        # Calculate cosine similarity matrix
        self.cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

    def get_similar_courses(self, course_id, n=10):
        """Find courses similar to given course"""
        if course_id not in self.course_indices:
            return []

        idx = self.course_indices[course_id]
        sim_scores = list(enumerate(self.cosine_sim[idx]))
        
        # Sort courses by similarity score in descending order
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
        
        # Get indices of top N similar courses (excluding self)
        similar_indices = [i for i, score in sim_scores if i != idx][:n]
        
        # Convert indices back to course IDs
        return [self.course_ids_list[i] for i in similar_indices]

    def get_recommendations_for_user(self, user_id, n=10):
        """Get personalized content-based recommendations"""
        # Fetch user's interacted courses (enrolled or rated)
        interactions = (
            self.db.query(Interaction)
            .filter(
                Interaction.user_id == user_id,
                Interaction.interaction_type.in_(['enrollment', 'completion', 'rating'])
            )
            .all()
        )
        
        interacted_course_ids = list(set(int(i.course_id) for i in interactions))
        
        # If no interactions: fallback to popularity
        if not interacted_course_ids:
            popular = self.db.query(Course.id).order_by(Course.enrollment_count.desc()).limit(n).all()
            return [p[0] for p in popular]

        # Aggregate similarity scores
        interacted_indices = [self.course_indices[c_id] for c_id in interacted_course_ids if c_id in self.course_indices]
        
        if not interacted_indices:
            popular = self.db.query(Course.id).order_by(Course.enrollment_count.desc()).limit(n).all()
            return [p[0] for p in popular]

        sim_scores = np.zeros(len(self.course_ids_list))
        for idx in interacted_indices:
            sim_scores += self.cosine_sim[idx]

        # Sort indices descending
        sorted_indices = np.argsort(sim_scores)[::-1]
        
        # Get top recommendations that user hasn't enrolled in/interacted with yet
        recommendations = []
        interacted_set = set(interacted_course_ids)
        
        for idx in sorted_indices:
            c_id = self.course_ids_list[idx]
            if c_id not in interacted_set:
                recommendations.append(c_id)
                if len(recommendations) == n:
                    break
                    
        # If we couldn't get enough recommendations, backfill with popular ones
        if len(recommendations) < n:
            popular = self.db.query(Course.id).order_by(Course.enrollment_count.desc()).all()
            for p in popular:
                p_id = p[0]
                if p_id not in interacted_set and p_id not in recommendations:
                    recommendations.append(p_id)
                    if len(recommendations) == n:
                        break
                        
        return recommendations
