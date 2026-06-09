from sqlalchemy import case, func, or_
from sqlalchemy.orm import Session, joinedload

from app.models.course import Course
from app.models.roadmap import LearningRoadmap
from app.models.roadmap_step import RoadmapStep


class RoadmapService:
    SKILL_CATEGORY_MAP = {
        "python": ["Programming", "Data Science", "ML", "AI"],
        "web dev": ["Web Dev", "Programming"],
        "ml": ["ML", "Data Science", "AI"],
        "ai": ["AI", "ML", "Programming"],
        "data science": ["Data Science", "ML", "AI"],
        "cloud": ["Cloud"],
        "mobile dev": ["Mobile Dev"],
        "cybersecurity": ["Cybersecurity"],
    }

    LEVEL_ORDER = case(
        (
            Course.level == "Beginner",
            1,
        ),
        (
            Course.level == "Intermediate",
            2,
        ),
        (
            Course.level == "Advanced",
            3,
        ),
        else_=4,
    )

    def __init__(self, db: Session):
        self.db = db

    def _build_skill_query(self, skill: str):
        normalized_skill = skill.strip().lower()
        categories = self.SKILL_CATEGORY_MAP.get(normalized_skill, [skill.title()])
        search_term = f"%{normalized_skill}%"

        return self.db.query(Course).filter(
            or_(
                Course.category.in_(categories),
                Course.tags.ilike(search_term),
                Course.title.ilike(search_term),
                Course.description.ilike(search_term),
            )
        )

    def generate_roadmap(self, user_id: int, skill: str, target_level: str, timeline: str | None = None) -> LearningRoadmap:
        query = self._build_skill_query(skill)
        courses = (
            query.order_by(self.LEVEL_ORDER, Course.enrollment_count.desc())
            .limit(6)
            .all()
        )

        if not courses:
            courses = (
                self.db.query(Course)
                .order_by(Course.enrollment_count.desc())
                .limit(5)
                .all()
            )

        roadmap = LearningRoadmap(
            user_id=user_id,
            skill_name=skill.title(),
            target_level=target_level.title(),
            timeline=timeline,
            is_active=True,
        )
        self.db.add(roadmap)
        self.db.commit()
        self.db.refresh(roadmap)

        steps = []
        for step_number, course in enumerate(courses[:5], start=1):
            status = "in_progress" if step_number == 1 else "locked"
            prerequisites = None if step_number == 1 else f"Complete step {step_number - 1} first"
            step = RoadmapStep(
                roadmap_id=roadmap.id,
                course_id=course.id,
                step_number=step_number,
                status=status,
                estimated_hours=course.duration_hours or 1,
                prerequisites=prerequisites,
            )
            self.db.add(step)
            steps.append(step)

        self.db.commit()
        for step in steps:
            self.db.refresh(step)
        self.db.refresh(roadmap)
        return roadmap

    def get_user_roadmaps(self, user_id: int) -> list[LearningRoadmap]:
        return (
            self.db.query(LearningRoadmap)
            .options(joinedload(LearningRoadmap.steps).joinedload(RoadmapStep.course))
            .filter(LearningRoadmap.user_id == user_id)
            .order_by(LearningRoadmap.updated_at.desc())
            .all()
        )

    def get_roadmap(self, user_id: int, roadmap_id: int) -> LearningRoadmap | None:
        return (
            self.db.query(LearningRoadmap)
            .options(joinedload(LearningRoadmap.steps).joinedload(RoadmapStep.course))
            .filter(
                LearningRoadmap.id == roadmap_id,
                LearningRoadmap.user_id == user_id,
            )
            .first()
        )

    def update_step_progress(self, user_id: int, step_id: int, status: str) -> RoadmapStep | None:
        allowed = {"locked", "in_progress", "completed"}
        if status not in allowed:
            raise ValueError("Invalid roadmap step status")

        step = self.db.query(RoadmapStep).join(LearningRoadmap).filter(RoadmapStep.id == step_id).first()
        if not step or step.roadmap.user_id != user_id:
            return None

        step.status = status
        self.db.commit()
        self.db.refresh(step)

        if status == "completed":
            next_step = (
                self.db.query(RoadmapStep)
                .filter(
                    RoadmapStep.roadmap_id == step.roadmap_id,
                    RoadmapStep.step_number == step.step_number + 1,
                )
                .first()
            )
            if next_step and next_step.status == "locked":
                next_step.status = "in_progress"
                self.db.commit()
                self.db.refresh(next_step)

            all_steps = self.db.query(RoadmapStep).filter(RoadmapStep.roadmap_id == step.roadmap_id).all()
            if all(s.status == "completed" for s in all_steps):
                step.roadmap.is_active = False
                self.db.commit()
                self.db.refresh(step.roadmap)

        return step

    def delete_roadmap(self, user_id: int, roadmap_id: int) -> bool:
        roadmap = self.db.query(LearningRoadmap).filter(
            LearningRoadmap.id == roadmap_id,
            LearningRoadmap.user_id == user_id,
        ).first()
        if not roadmap:
            return False

        self.db.delete(roadmap)
        self.db.commit()
        return True

    def add_course_to_roadmap(
        self,
        user_id: int,
        roadmap_id: int,
        course_id: int,
        estimated_hours: int | None = None,
        status: str = "locked",
        prerequisites: str | None = None,
    ) -> RoadmapStep | None:
        roadmap = self.db.query(LearningRoadmap).filter(
            LearningRoadmap.id == roadmap_id,
            LearningRoadmap.user_id == user_id,
        ).first()
        if not roadmap:
            return None

        max_step = (
            self.db.query(func.max(RoadmapStep.step_number))
            .filter(RoadmapStep.roadmap_id == roadmap_id)
            .scalar()
        ) or 0

        step = RoadmapStep(
            roadmap_id=roadmap_id,
            course_id=course_id,
            step_number=max_step + 1,
            status=status,
            estimated_hours=estimated_hours or 0,
            prerequisites=prerequisites,
        )
        self.db.add(step)
        self.db.commit()
        self.db.refresh(step)
        return step
