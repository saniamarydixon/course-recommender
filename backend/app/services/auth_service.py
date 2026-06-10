from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.schemas.auth import Token, UserLogin, UserRegister
from app.schemas.user import UserCreate
from app.services.user_service import UserService
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_service = UserService(db)

    def register(self, data: UserRegister) -> Token:
        if self.user_service.get_by_email(data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        if self.user_service.get_by_username(data.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken",
            )

        user = self.user_service.create(
            UserCreate(
                email=data.email,
                username=data.username,
                password=data.password,
                full_name=data.full_name,
            )
        )
        
        # Create welcome notification
        from app.services.notification_service import NotificationService
        NotificationService(self.db).create_notification(
            user_id=user.id,
            type="system",
            title="Welcome to CourseRec AI! 🎓",
            message=f"Welcome, {user.full_name or user.username}! Discover customized course paths and advance your skills today.",
            link="/dashboard"
        )

        return self._create_tokens(str(user.id))

    def login(self, data: UserLogin) -> Token:
        user = self.user_service.get_by_email(data.email)
        if not user or not verify_password(data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive",
            )
        return self._create_tokens(str(user.id))

    def refresh(self, refresh_token: str) -> Token:
        payload = decode_token(refresh_token)
        if payload is None or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        user_id = payload.get("sub")
        user = self.user_service.get_by_id(int(user_id))
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )

        return self._create_tokens(str(user.id))

    def _create_tokens(self, user_id: str) -> Token:
        return Token(
            access_token=create_access_token(user_id),
            refresh_token=create_refresh_token(user_id),
        )
