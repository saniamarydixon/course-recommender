from fastapi import APIRouter, Depends, HTTPException, Query, status, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.database import get_db
from app.models.user import User
from app.schemas.course import CourseCreate, CourseResponse, CourseUpdate
from app.services.course_service import CourseService
from app.services.interaction_service import InteractionService
from app.utils.dependencies import get_current_user

router = APIRouter()


class ProgressUpdate(BaseModel):
    progress: int = Field(..., ge=0, le=100)


@router.get("/test")
def courses_test():
    return {"status": "ok", "module": "courses"}


@router.get("/", response_model=list[CourseResponse])
def list_courses(
    skip: int = 0,
    limit: int = Query(default=100, le=200),
    category: str | None = None,
    level: str | None = None,
    db: Session = Depends(get_db),
):
    return CourseService(db).get_all(skip=skip, limit=limit, category=category, level=level)


@router.get("/{course_id}", response_model=CourseResponse)
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = CourseService(db).get_by_id(course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course


@router.post("/{course_id}/enroll")
def enroll_in_course(
    course_id: int,
    body: dict = Body(default={}),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = CourseService(db).get_by_id(course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    InteractionService(db).enroll_user_in_course(current_user, course)
    return {"message": "Enrolled successfully"}


@router.delete("/{course_id}/enroll")
def unenroll_from_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = CourseService(db).get_by_id(course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    unenroll_success = InteractionService(db).unenroll_user_from_course(current_user.id, course_id)
    if not unenroll_success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not enrolled in this course")
    return {"message": "Successfully unenrolled"}


@router.get("/{course_id}/enrollment-status")
def get_enrollment_status(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check if enrolled
    enrollments = InteractionService(db).get_user_enrollments(current_user.id)
    for enrollment in enrollments:
        if enrollment.course_id == course_id:
            return {"is_enrolled": True, "progress": enrollment.progress or 0}
    return {"is_enrolled": False, "progress": 0}


@router.post("/{course_id}/wishlist")
def add_to_wishlist(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = CourseService(db).get_by_id(course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    InteractionService(db).add_course_to_wishlist(current_user.id, course_id)
    return {"message": "Added to wishlist"}


@router.delete("/{course_id}/wishlist")
def remove_from_wishlist(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = CourseService(db).get_by_id(course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    removed = InteractionService(db).remove_course_from_wishlist(current_user.id, course_id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not in wishlist")
    return {"message": "Removed from wishlist"}


@router.put("/{course_id}/progress")
def update_course_progress(
    course_id: int,
    progress_data: ProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = CourseService(db).get_by_id(course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    interaction = InteractionService(db).update_interaction_progress(
        current_user.id, course_id, progress_data.progress
    )
    if not interaction:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not enrolled in this course")
    return {"message": "Progress updated successfully", "progress": interaction.progress}


@router.post("/{course_id}/complete")
def complete_enrolled_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = CourseService(db).get_by_id(course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    interaction = InteractionService(db).complete_course(current_user.id, course_id)
    if not interaction:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to complete course")
    return {"message": "Course marked as completed"}


@router.post("/", response_model=CourseResponse, status_code=201)
def create_course(
    course_data: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create courses",
        )
    return CourseService(db).create(course_data)


@router.put("/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: int,
    course_data: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update courses",
        )
    course = CourseService(db).get_by_id(course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return CourseService(db).update(course, course_data)


@router.delete("/{course_id}", status_code=204)
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete courses",
        )
    course = CourseService(db).get_by_id(course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    CourseService(db).delete(course)
