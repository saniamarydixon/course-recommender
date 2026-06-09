from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.course import CourseResponse


class RecommendationRequest(BaseModel):
    limit: int = Field(default=10, ge=1, le=50)
    categories: list[str] | None = None
    level: str | None = None


class RecommendationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    course_id: int
    score: float
    reason: str | None = None
    created_at: datetime
    course: CourseResponse | None = None
