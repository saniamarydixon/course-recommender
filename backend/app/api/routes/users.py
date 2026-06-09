from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.interaction import EnrolledCourseItem
from app.schemas.user import UserResponse, UserUpdate
from app.services.interaction_service import InteractionService
from app.services.user_service import UserService
from app.utils.dependencies import get_current_user

router = APIRouter()


@router.get("/test")
def users_test():
    return {"status": "ok", "module": "users"}


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_current_user_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return UserService(db).update(current_user, user_data)


@router.get("/me/enrolled-courses", response_model=list[EnrolledCourseItem])
def get_current_user_enrolled_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    enrollments = InteractionService(db).get_user_enrollments(current_user.id)
    return [
        EnrolledCourseItem(
            course=enrollment.course,
            progress=enrollment.progress or 0,
            status="completed" if enrollment.progress >= 100 else "in_progress",
            last_accessed=enrollment.updated_at,
        )
        for enrollment in enrollments
    ]


@router.get("/", response_model=list[UserResponse])
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to list users",
        )
    return UserService(db).get_all(skip=skip, limit=limit)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = UserService(db).get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if current_user.id != user_id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this user",
        )
    return user
