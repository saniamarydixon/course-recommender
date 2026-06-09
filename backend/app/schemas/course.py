from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CourseBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    category: str = Field(..., min_length=1, max_length=100)
    level: str = Field(..., min_length=1, max_length=50)
    duration_hours: int = Field(default=0, ge=0)
    price: float = Field(default=0.0, ge=0.0)
    rating: float = Field(default=0.0, ge=0.0, le=5.0)
    total_ratings: int = Field(default=0, ge=0)
    enrollment_count: int = Field(default=0, ge=0)
    instructor: str | None = None
    thumbnail_url: str | None = Field(None, max_length=500)
    url: str | None = None
    tags: str | None = None


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    category: str | None = Field(None, min_length=1, max_length=100)
    level: str | None = Field(None, min_length=1, max_length=50)
    duration_hours: int | None = Field(None, ge=0)
    price: float | None = Field(None, ge=0.0)
    rating: float | None = Field(None, ge=0.0, le=5.0)
    total_ratings: int | None = Field(None, ge=0)
    enrollment_count: int | None = Field(None, ge=0)
    instructor: str | None = None
    thumbnail_url: str | None = Field(None, max_length=500)
    url: str | None = None
    tags: str | None = None


class CourseResponse(CourseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
