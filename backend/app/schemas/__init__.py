from app.schemas.auth import RefreshTokenRequest, Token, TokenPayload, UserLogin, UserRegister
from app.schemas.course import CourseCreate, CourseResponse, CourseUpdate
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from app.schemas.user import UserCreate, UserResponse, UserUpdate

__all__ = [
    "RefreshTokenRequest",
    "Token",
    "TokenPayload",
    "UserLogin",
    "UserRegister",
    "CourseCreate",
    "CourseResponse",
    "CourseUpdate",
    "RecommendationRequest",
    "RecommendationResponse",
    "UserCreate",
    "UserResponse",
    "UserUpdate",
]
