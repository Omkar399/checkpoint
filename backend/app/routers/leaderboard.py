from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, extract
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.checkin import CheckIn
from app.models.channel_member import ChannelMember
from app.services import channel_service

router = APIRouter(prefix="/api/v1", tags=["leaderboard"])


@router.get("/channels/{channel_id}/leaderboard")
def get_leaderboard(
    channel_id: int,
    month: int | None = Query(default=None),
    year: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    channel = channel_service.get_channel(db, channel_id)
    if channel is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found"
        )
    cm = channel_service.check_channel_membership(db, current_user.id, channel_id)
    if cm is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this channel",
        )

    now = datetime.now(timezone.utc)
    target_month = month or now.month
    target_year = year or now.year

    rows = (
        db.query(
            CheckIn.user_id,
            User.username,
            User.avatar_url,
            func.count(CheckIn.id).label("checkin_count"),
        )
        .join(User, CheckIn.user_id == User.id)
        .filter(
            CheckIn.channel_id == channel_id,
            extract("month", CheckIn.checked_in_at) == target_month,
            extract("year", CheckIn.checked_in_at) == target_year,
        )
        .group_by(CheckIn.user_id, User.username, User.avatar_url)
        .order_by(func.count(CheckIn.id).desc())
        .all()
    )

    result = []
    for rank, row in enumerate(rows, 1):
        result.append(
            {
                "rank": rank,
                "user_id": row.user_id,
                "username": row.username,
                "avatar_url": row.avatar_url,
                "checkin_count": row.checkin_count,
            }
        )

    return result
