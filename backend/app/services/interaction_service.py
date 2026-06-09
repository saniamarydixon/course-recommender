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
                Interaction.interaction_type == "enrollment",
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
                Interaction.interaction_type == "enrollment",
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

    def update_interaction_progress(
        self, user_id: int, course_id: int, progress: int
    ) -> Interaction | None:
        interaction = (
            self.db.query(Interaction)
            .filter(
                Interaction.user_id == user_id,
                Interaction.course_id == course_id,
                Interaction.interaction_type == "enrollment",
            )
            .first()
        )
        if not interaction:
            return None

        interaction.progress = min(max(progress, 0), 100)
        interaction.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(interaction)
        return interaction
