from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.checkin import (
    CheckInCreate,
    CheckInResponse,
    DailyStatusEntry,
)
from app.services import channel_service, checkin_service

router = APIRouter(prefix="/api/v1", tags=["checkins"])


def _require_channel_member(db: Session, user_id: int, channel_id: int):
    """Verify user is a member of the channel."""
    channel = channel_service.get_channel(db, channel_id)
    if channel is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found"
        )
    cm = channel_service.check_channel_membership(db, user_id, channel_id)
    if cm is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this channel",
        )
    return channel


@router.post(
    "/channels/{channel_id}/checkins", response_model=CheckInResponse
)
def create_checkin(
    channel_id: int,
    req: CheckInCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_channel_member(db, current_user.id, channel_id)
    checkin = checkin_service.create_checkin(
        db,
        user_id=current_user.id,
        channel_id=channel_id,
        value=req.value,
        note=req.note,
    )
    return checkin


@router.get(
    "/channels/{channel_id}/checkins", response_model=list[CheckInResponse]
)
def get_checkins(
    channel_id: int,
    date: date | None = Query(default=None),
    limit: int = Query(default=50, le=100, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_channel_member(db, current_user.id, channel_id)
    return checkin_service.get_channel_checkins(
        db, channel_id=channel_id, target_date=date, limit=limit
    )


@router.get(
    "/channels/{channel_id}/dashboard", response_model=list[DailyStatusEntry]
)
def get_dashboard(
    channel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    channel = _require_channel_member(db, current_user.id, channel_id)
    return checkin_service.get_daily_dashboard(
        db, server_id=channel.server_id, channel_id=channel_id
    )


@router.get("/channels/{channel_id}/streak")
def get_streak(
    channel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_channel_member(db, current_user.id, channel_id)
    streak = checkin_service.get_user_streak(
        db, user_id=current_user.id, channel_id=channel_id
    )
    return {"streak": streak}
