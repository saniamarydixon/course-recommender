from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.interaction import EnrolledCourseItem


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    full_name: str | None = None
    bio: str | None = None
    interests: str | None = None
    avatar_url: str | None = None
    location: str | None = None
    skills: str | None = None
    social_links: dict | None = None
    is_public: bool = False


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)


class UserUpdate(BaseModel):
    full_name: str | None = None
    bio: str | None = None
    interests: str | None = None
    password: str | None = Field(None, min_length=8, max_length=128)
    avatar_url: str | None = None
    location: str | None = None
    skills: str | None = None
    social_links: dict | None = None
    is_public: bool | None = None


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class UserPublicResponse(UserResponse):
    enrolled_courses: list[EnrolledCourseItem] = []

