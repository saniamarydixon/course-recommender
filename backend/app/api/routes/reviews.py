from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.review import Review
from app.models.course import Course
from app.schemas.review import ReviewCreate, ReviewUpdate, ReviewResponse
from app.services.interaction_service import InteractionService
from app.utils.dependencies import get_current_user

router = APIRouter()


@router.post("/courses/{course_id}/reviews", response_model=ReviewResponse)
def create_course_review(
    course_id: int,
    data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check if course exists
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    # Check if enrolled
    enrollments = InteractionService(db).get_user_enrollments(current_user.id)
    is_enrolled = any(e.course_id == course_id for e in enrollments)
    if not is_enrolled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must be enrolled in the course to write a review",
        )

    # Check if already reviewed
    existing_review = (
        db.query(Review)
        .filter(Review.user_id == current_user.id, Review.course_id == course_id)
        .first()
    )
    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reviewed this course",
        )

    review = Review(
        user_id=current_user.id,
        course_id=course_id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    # Fetch review with loaded user relationship for response
    review = (
        db.query(Review)
        .options(joinedload(Review.user))
        .filter(Review.id == review.id)
        .first()
    )
    return review


@router.get("/courses/{course_id}/reviews", response_model=list[ReviewResponse])
def get_course_reviews(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    reviews = (
        db.query(Review)
        .options(joinedload(Review.user))
        .filter(Review.course_id == course_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return reviews


@router.put("/reviews/{review_id}", response_model=ReviewResponse)
def update_review(
    review_id: int,
    data: ReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = (
        db.query(Review)
        .options(joinedload(Review.user))
        .filter(Review.id == review_id)
        .first()
    )
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    if review.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to edit this review",
        )

    if data.rating is not None:
        review.rating = data.rating
    if data.comment is not None:
        review.comment = data.comment

    review.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(review)
    return review


@router.delete("/reviews/{review_id}")
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    if review.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this review",
        )

    db.delete(review)
    db.commit()
    return {"message": "Review deleted successfully"}


@router.get("/users/me/reviews", response_model=list[ReviewResponse])
def get_my_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reviews = (
        db.query(Review)
        .options(joinedload(Review.user))
        .filter(Review.user_id == current_user.id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return reviews
