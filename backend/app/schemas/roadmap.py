from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.course import CourseResponse


class RoadmapBase(BaseModel):
    skill_name: str = Field(..., min_length=1, max_length=120)
    target_level: str = Field(..., min_length=1, max_length=50)
    timeline: str | None = Field(None, max_length=50)
    is_active: bool = True


class RoadmapCreate(BaseModel):
    skill: str = Field(..., min_length=1, max_length=120)
    target_level: str = Field(..., min_length=1, max_length=50)
    timeline: str | None = Field(None, max_length=50)


class RoadmapStepBase(BaseModel):
    course_id: int
    step_number: int | None = None
    status: str = Field(default="locked", max_length=30)
    estimated_hours: int | None = Field(None, ge=0)
    prerequisites: str | None = None


class RoadmapStepCreate(BaseModel):
    course_id: int
    estimated_hours: int | None = Field(None, ge=0)
    status: str = Field(default="locked", max_length=30)
    prerequisites: str | None = None


class RoadmapStepResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    roadmap_id: int
    course_id: int
    step_number: int
    status: str
    estimated_hours: int
    prerequisites: str | None = None
    course: CourseResponse | None = None
    created_at: datetime
    updated_at: datetime


class RoadmapStepUpdate(BaseModel):
    status: str = Field(..., max_length=30)


class RoadmapResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    skill_name: str
    target_level: str
    timeline: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    steps: list[RoadmapStepResponse] = []


class RoadmapWithSteps(RoadmapResponse):
    pass


class RoadmapOverviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    skill_name: str
    target_level: str
    timeline: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    steps: list[RoadmapStepResponse] = []
