from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.user import UserResponse
from app.schemas.checkin import HeatmapEntry
from app.services import checkin_service

router = APIRouter(prefix="/api/v1", tags=["users"])


@router.get("/users/{user_id}/profile", response_model=UserResponse)
def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = checkin_service.get_user_profile(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return user


@router.get("/users/{user_id}/heatmap", response_model=list[HeatmapEntry])
def get_user_heatmap(
    user_id: int,
    channel_id: int | None = Query(default=None),
    year: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = checkin_service.get_user_profile(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return checkin_service.get_user_heatmap(
        db, user_id=user_id, channel_id=channel_id, year=year
    )
