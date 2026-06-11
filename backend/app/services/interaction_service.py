from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.course import Course
from app.models.interaction import Interaction
from app.models.user import User


class InteractionService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_enrollments(self, user_id: int) -> list[Interaction]:
        return (
            self.db.query(Interaction)
            .options(joinedload(Interaction.course))
            .filter(
                Interaction.user_id == user_id,
                Interaction.interaction_type.in_(["enrollment", "completion"]),
            )
            .order_by(Interaction.updated_at.desc())
            .all()
        )

    def enroll_user_in_course(self, user: User, course: Course) -> Interaction:
        interaction = (
            self.db.query(Interaction)
            .filter(
                Interaction.user_id == user.id,
                Interaction.course_id == course.id,
                Interaction.interaction_type.in_(["enrollment", "completion"]),
            )
            .first()
        )

        if interaction:
            interaction.updated_at = datetime.now(timezone.utc)
            self.db.commit()
            self.db.refresh(interaction)
            return interaction

        interaction = Interaction(
            user_id=user.id,
            course_id=course.id,
            interaction_type="enrollment",
            progress=0,
        )
        self.db.add(interaction)
        course.enrollment_count += 1
        self.db.add(course)
        self.db.commit()
        self.db.refresh(interaction)
        self.db.refresh(course)



        return interaction

    def unenroll_user_from_course(self, user_id: int, course_id: int) -> bool:
        interactions = (
            self.db.query(Interaction)
            .filter(
                Interaction.user_id == user_id,
                Interaction.course_id == course_id,
                Interaction.interaction_type.in_(["enrollment", "completion"]),
            )
            .all()
        )
        if not interactions:
            return False

        for interaction in interactions:
            self.db.delete(interaction)

        course = self.db.query(Course).filter(Course.id == course_id).first()
        if course and course.enrollment_count > 0:
            course.enrollment_count = max(course.enrollment_count - 1, 0)
            self.db.add(course)

        self.db.commit()
        return True

    def update_interaction_progress(
        self, user_id: int, course_id: int, progress: int
    ) -> Interaction | None:
        interaction = (
            self.db.query(Interaction)
            .filter(
                Interaction.user_id == user_id,
                Interaction.course_id == course_id,
                Interaction.interaction_type.in_(["enrollment", "completion"]),
            )
            .first()
        )
        if not interaction:
            return None

        was_completed = (interaction.interaction_type == "completion")
        interaction.progress = min(max(progress, 0), 100)
        
        if interaction.progress >= 100:
            interaction.interaction_type = "completion"

        else:
            interaction.interaction_type = "enrollment"
            
        interaction.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(interaction)
        return interaction

    def complete_course(self, user_id: int, course_id: int) -> Interaction | None:
        interaction = (
            self.db.query(Interaction)
            .filter(
                Interaction.user_id == user_id,
                Interaction.course_id == course_id,
                Interaction.interaction_type.in_(["enrollment", "completion"]),
            )
            .first()
        )
        was_completed = False
        if not interaction:
            # If not enrolled, we enroll them first
            course = self.db.query(Course).filter(Course.id == course_id).first()
            if not course:
                return None
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                return None
            interaction = Interaction(
                user_id=user_id,
                course_id=course_id,
                interaction_type="completion",
                progress=100,
            )
            self.db.add(interaction)
            course.enrollment_count += 1
            self.db.add(course)
        else:
            was_completed = (interaction.interaction_type == "completion")
            interaction.progress = 100
            interaction.interaction_type = "completion"
            
        interaction.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(interaction)



        return interaction

    def get_user_wishlist(self, user_id: int) -> list[Course]:
        interactions = (
            self.db.query(Interaction)
            .options(joinedload(Interaction.course))
            .filter(
                Interaction.user_id == user_id,
                Interaction.interaction_type == "wishlist",
            )
            .all()
        )
        return [interaction.course for interaction in interactions if interaction.course]

    def add_course_to_wishlist(self, user_id: int, course_id: int) -> Interaction:
        interaction = (
            self.db.query(Interaction)
            .filter(
                Interaction.user_id == user_id,
                Interaction.course_id == course_id,
                Interaction.interaction_type == "wishlist",
            )
            .first()
        )
        if not interaction:
            interaction = Interaction(
                user_id=user_id,
                course_id=course_id,
                interaction_type="wishlist",
                progress=0,
            )
            self.db.add(interaction)
            self.db.commit()
            self.db.refresh(interaction)
        return interaction

    def remove_course_from_wishlist(self, user_id: int, course_id: int) -> bool:
        interaction = (
            self.db.query(Interaction)
            .filter(
                Interaction.user_id == user_id,
                Interaction.course_id == course_id,
                Interaction.interaction_type == "wishlist",
            )
            .first()
        )
        if interaction:
            self.db.delete(interaction)
            self.db.commit()
            return True
        return False
