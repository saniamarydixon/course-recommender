from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.roadmap import (
    RoadmapCreate,
    RoadmapOverviewResponse,
    RoadmapResponse,
    RoadmapStepCreate,
    RoadmapStepResponse,
    RoadmapStepUpdate,
)
from app.services.roadmap_service import RoadmapService
from app.utils.dependencies import get_current_user

router = APIRouter()


@router.get("/test")
def roadmap_test():
    return {"status": "ok", "module": "roadmap"}


@router.post("/generate", response_model=RoadmapResponse, status_code=201)
def generate_roadmap(
    roadmap_data: RoadmapCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    roadmap = RoadmapService(db).generate_roadmap(
        current_user.id,
        roadmap_data.skill,
        roadmap_data.target_level,
        roadmap_data.timeline,
    )
    return roadmap


@router.get("/my-roadmaps", response_model=list[RoadmapOverviewResponse])
def my_roadmaps(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    roadmaps = RoadmapService(db).get_user_roadmaps(current_user.id)
    return roadmaps


@router.get("/{roadmap_id}", response_model=RoadmapResponse)
def get_roadmap(
    roadmap_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    roadmap = RoadmapService(db).get_roadmap(current_user.id, roadmap_id)
    if not roadmap:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap not found")
    return roadmap


@router.put("/step/{step_id}", response_model=RoadmapStepResponse)
def update_roadmap_step(
    step_id: int,
    step_data: RoadmapStepUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        step = RoadmapService(db).update_step_progress(current_user.id, step_id, step_data.status)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    if not step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap step not found")

    return step


@router.delete("/{roadmap_id}", status_code=204)
def delete_roadmap(
    roadmap_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deleted = RoadmapService(db).delete_roadmap(current_user.id, roadmap_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap not found")


@router.post("/{roadmap_id}/steps", response_model=RoadmapStepResponse, status_code=201)
def add_roadmap_step(
    roadmap_id: int,
    step_data: RoadmapStepCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    step = RoadmapService(db).add_course_to_roadmap(
        current_user.id,
        roadmap_id,
        step_data.course_id,
        estimated_hours=step_data.estimated_hours,
        status=step_data.status,
        prerequisites=step_data.prerequisites,
    )
    if not step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap not found")
    return step
