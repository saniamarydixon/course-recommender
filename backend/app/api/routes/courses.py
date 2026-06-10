from fastapi import APIRouter, Depends, HTTPException, Query, status, Body
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from pydantic import BaseModel, Field

from app.database import get_db
from app.models.user import User
from app.models.course import Course
from app.schemas.course import CourseCreate, CourseResponse, CourseUpdate, CourseSearchResponse
from app.services.course_service import CourseService
from app.services.interaction_service import InteractionService
from app.services.certificate_service import CertificateService
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


@router.get("/search", response_model=CourseSearchResponse)
def search_courses(
    q: str | None = None,
    category: list[str] | None = Query(None),
    categories: list[str] | None = Query(None),
    level: list[str] | None = Query(None),
    levels: list[str] | None = Query(None),
    min_price: float | None = None,
    max_price: float | None = None,
    min_rating: float | None = None,
    min_duration: int | None = None,
    max_duration: int | None = None,
    is_free: bool | None = None,
    has_certificate: bool | None = None,
    sort_by: str | None = None,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=12, ge=1, le=100),
    db: Session = Depends(get_db),
):
    # Combine list options to handle arrays sent in different formats
    all_categories = []
    if category:
        all_categories.extend(category)
    if categories:
        all_categories.extend(categories)
    final_categories = []
    for c in all_categories:
        if ',' in c:
            final_categories.extend([item.strip() for item in c.split(',') if item.strip()])
        else:
            final_categories.append(c)

    all_levels = []
    if level:
        all_levels.extend(level)
    if levels:
        all_levels.extend(levels)
    final_levels = []
    for l in all_levels:
        if ',' in l:
            final_levels.extend([item.strip() for item in l.split(',') if item.strip()])
        else:
            final_levels.append(l)

    query = db.query(Course)

    if q:
        query = query.filter(
            or_(
                Course.title.ilike(f"%{q}%"),
                Course.description.ilike(f"%{q}%"),
                Course.instructor.ilike(f"%{q}%"),
                Course.tags.ilike(f"%{q}%")
            )
        )

    if final_categories:
        query = query.filter(Course.category.in_(final_categories))

    if final_levels:
        query = query.filter(Course.level.in_(final_levels))

    if min_price is not None:
        query = query.filter(Course.price >= min_price)

    if max_price is not None:
        query = query.filter(Course.price <= max_price)

    if is_free is not None:
        if is_free:
            query = query.filter(Course.price == 0.0)
        else:
            query = query.filter(Course.price > 0.0)

    if min_rating is not None:
        query = query.filter(Course.rating >= min_rating)

    if min_duration is not None:
        query = query.filter(Course.duration_hours >= min_duration)

    if max_duration is not None:
        query = query.filter(Course.duration_hours <= max_duration)

    if has_certificate is not None:
        query = query.filter(Course.has_certificate == has_certificate)

    # Sorting
    if sort_by:
        sort_by_lower = sort_by.lower()
        if sort_by_lower in ["rating_desc", "highest_rated"]:
            query = query.order_by(Course.rating.desc())
        elif sort_by_lower in ["price_asc", "lowest_price"]:
            query = query.order_by(Course.price.asc())
        elif sort_by_lower in ["price_desc", "highest_price"]:
            query = query.order_by(Course.price.desc())
        elif sort_by_lower in ["popularity_desc", "most_popular"]:
            query = query.order_by(Course.enrollment_count.desc())
        elif sort_by_lower in ["newest"]:
            query = query.order_by(Course.created_at.desc())
        elif sort_by_lower in ["duration_asc", "shortest"]:
            query = query.order_by(Course.duration_hours.asc())
        elif sort_by_lower in ["duration_desc", "longest"]:
            query = query.order_by(Course.duration_hours.desc())
        else:
            query = query.order_by(Course.id.asc())
    else:
        query = query.order_by(Course.id.asc())

    # Total count
    total = query.count()

    # Apply pagination
    offset = (page - 1) * per_page
    courses = query.offset(offset).limit(per_page).all()

    pages = (total + per_page - 1) // per_page

    return {
        "courses": courses,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": pages
    }


@router.get("/{course_id}", response_model=CourseResponse)
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = CourseService(db).get_by_id(course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course


@router.get("/{course_id}/certificate")
def get_course_certificate(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = CourseService(db).get_by_id(course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    if not course.has_certificate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This course does not offer certificates"
        )

    # Check enrollment & progress
    enrollments = InteractionService(db).get_user_enrollments(current_user.id)
    enrolled = False
    completed = False
    progress = 0
    for enrollment in enrollments:
        if enrollment.course_id == course_id:
            enrolled = True
            progress = enrollment.progress or 0
            if enrollment.interaction_type == "completion" or progress >= 100:
                completed = True
            break

    if not enrolled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not enrolled in this course"
        )

    if not completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You must complete the course (100% progress) to download the certificate. Current progress is {progress}%."
        )

    # Generate certificate PDF
    pdf_buffer = CertificateService().generate_certificate(current_user, course)
    
    # Format filename cleanly
    safe_title = "".join([c if c.isalnum() else "_" for c in course.title])
    filename = f"Certificate_{safe_title}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )



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
