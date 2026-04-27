from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.channel import Channel
from app.models.channel_member import ChannelMember
from app.models.server import Server
from app.models.checkin import CheckIn
from app.schemas.user import UserResponse
from app.schemas.checkin import HeatmapEntry
from app.services import checkin_service

router = APIRouter(prefix="/api/v1", tags=["users"])


class TodayChannelEntry(BaseModel):
    channel_id: int
    channel_name: str
    channel_kind: str
    server_id: int
    server_name: str
    checked_in: bool
    last_checkin_at: Optional[datetime] = None


@router.get("/users/me/today", response_model=list[TodayChannelEntry])
def get_my_today(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Per-channel today-status for the current user across all memberships."""
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0, tzinfo=None
    )
    tomorrow_start = today_start + timedelta(days=1)

    rows = (
        db.query(Channel, Server)
        .join(ChannelMember, ChannelMember.channel_id == Channel.id)
        .join(Server, Server.id == Channel.server_id)
        .filter(ChannelMember.user_id == current_user.id)
        .order_by(Server.name.asc(), Channel.name.asc())
        .all()
    )

    today_checkins = (
        db.query(CheckIn)
        .filter(
            CheckIn.user_id == current_user.id,
            CheckIn.checked_in_at >= today_start,
            CheckIn.checked_in_at < tomorrow_start,
        )
        .all()
    )
    latest_by_channel: dict[int, CheckIn] = {}
    for ci in today_checkins:
        existing = latest_by_channel.get(ci.channel_id)
        if existing is None or ci.checked_in_at > existing.checked_in_at:
            latest_by_channel[ci.channel_id] = ci

    result: list[TodayChannelEntry] = []
    for channel, server in rows:
        ci = latest_by_channel.get(channel.id)
        result.append(
            TodayChannelEntry(
                channel_id=channel.id,
                channel_name=channel.name,
                channel_kind=channel.kind or "numeric",
                server_id=server.id,
                server_name=server.name,
                checked_in=ci is not None,
                last_checkin_at=ci.checked_in_at if ci else None,
            )
        )
    return result


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
