from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
import shutil
import os

from app.database import get_db
from app.models.user import User
from app.schemas.course import CourseResponse
from app.schemas.interaction import EnrolledCourseItem
from app.schemas.user import UserResponse, UserUpdate, UserPublicResponse
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


@router.get("/me/enrollments", response_model=list[EnrolledCourseItem])
def get_current_user_enrollments(
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


@router.get("/me/wishlist", response_model=list[CourseResponse])
def get_current_user_wishlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return InteractionService(db).get_user_wishlist(current_user.id)


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


# Combined user ID (integer) and username (string) lookups are handled below by /{username} route


@router.post("/me/avatar")
def update_avatar(
    avatar_url: str | None = Form(None),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file:
        os.makedirs("static/avatars", exist_ok=True)
        _, ext = os.path.splitext(file.filename)
        filename = f"user_{current_user.id}{ext}"
        file_path = f"static/avatars/{filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        current_user.avatar_url = f"http://localhost:8000/static/avatars/{filename}"
    elif avatar_url:
        current_user.avatar_url = avatar_url
        
    db.commit()
    db.refresh(current_user)
    return {"avatar_url": current_user.avatar_url}


@router.get("/{username}", response_model=UserPublicResponse)
def get_public_profile(
    username: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Handle user ID lookup (numeric)
    if username.isdigit():
        user_id = int(username)
        user = UserService(db).get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
        # Enforce strict self-or-superuser check for ID based lookups
        if current_user.id != user_id and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this user",
            )
            
        enrollments = InteractionService(db).get_user_enrollments(user.id)
        enrolled_courses = [
            EnrolledCourseItem(
                course=enrollment.course,
                progress=enrollment.progress or 0,
                status="completed" if enrollment.progress >= 100 else "in_progress",
                last_accessed=enrollment.updated_at,
            )
            for enrollment in enrollments
        ]
        
        response_obj = UserPublicResponse.model_validate(user)
        response_obj.enrolled_courses = enrolled_courses
        return response_obj

    # 2. Handle username lookup (string)
    user = UserService(db).get_by_username(username)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Verify publicity and authorization constraints
    if not user.is_public and current_user.id != user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This profile is private",
        )
    
    # Fetch enrolled courses
    enrollments = InteractionService(db).get_user_enrollments(user.id)
    enrolled_courses = [
        EnrolledCourseItem(
            course=enrollment.course,
            progress=enrollment.progress or 0,
            status="completed" if enrollment.progress >= 100 else "in_progress",
            last_accessed=enrollment.updated_at,
        )
        for enrollment in enrollments
    ]
    
    response_obj = UserPublicResponse.model_validate(user)
    response_obj.enrolled_courses = enrolled_courses
    return response_obj

