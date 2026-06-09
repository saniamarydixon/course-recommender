from sqlalchemy.orm import Session

from app.models.course import Course
from app.schemas.course import CourseCreate, CourseUpdate


class CourseService:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, course_id: int) -> Course | None:
        return self.db.query(Course).filter(Course.id == course_id).first()

    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        category: str | None = None,
        level: str | None = None,
    ) -> list[Course]:
        query = self.db.query(Course)
        if category:
            query = query.filter(Course.category == category)
        if level:
            query = query.filter(Course.level == level)
        return query.offset(skip).limit(limit).all()

    def create(self, course_data: CourseCreate) -> Course:
        course = Course(**course_data.model_dump())
        self.db.add(course)
        self.db.commit()
        self.db.refresh(course)
        return course

    def update(self, course: Course, course_data: CourseUpdate) -> Course:
        update_data = course_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(course, field, value)
        self.db.commit()
        self.db.refresh(course)
        return course

    def delete(self, course: Course) -> None:
        self.db.delete(course)
        self.db.commit()
