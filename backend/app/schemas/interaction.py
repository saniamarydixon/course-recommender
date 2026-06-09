from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.course import CourseResponse


class EnrolledCourseItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    course: CourseResponse
    progress: int
    status: str
    last_accessed: datetime | None = None
