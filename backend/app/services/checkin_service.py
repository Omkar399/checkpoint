from datetime import datetime, date, timezone, timedelta

from sqlalchemy import func, cast, Date
from sqlalchemy.orm import Session, joinedload

from app.models.checkin import CheckIn
from app.models.channel_member import ChannelMember
from app.models.user import User


def create_checkin(
    db: Session,
    user_id: int,
    channel_id: int,
    value: float | None = None,
    note: str | None = None,
) -> CheckIn:
    checkin = CheckIn(
        user_id=user_id,
        channel_id=channel_id,
        value=value,
        note=note,
    )
    db.add(checkin)
    db.commit()
    db.refresh(checkin)
    return (
        db.query(CheckIn)
        .options(joinedload(CheckIn.user))
        .filter(CheckIn.id == checkin.id)
        .first()
    )


def get_channel_checkins(
    db: Session,
    channel_id: int,
    target_date: date | None = None,
    limit: int = 50,
) -> list[CheckIn]:
    query = (
        db.query(CheckIn)
        .options(joinedload(CheckIn.user))
        .filter(CheckIn.channel_id == channel_id)
    )
    if target_date is not None:
        start = datetime.combine(target_date, datetime.min.time())
        end = start + timedelta(days=1)
        query = query.filter(
            CheckIn.checked_in_at >= start,
            CheckIn.checked_in_at < end,
        )
    return query.order_by(CheckIn.checked_in_at.desc()).limit(limit).all()


def get_daily_dashboard(
    db: Session,
    server_id: int,
    channel_id: int,
) -> list[dict]:
    today = datetime.now(timezone.utc).date()
    start = datetime.combine(today, datetime.min.time())
    end = start + timedelta(days=1)

    members = (
        db.query(ChannelMember)
        .options(joinedload(ChannelMember.user))
        .filter(ChannelMember.channel_id == channel_id)
        .all()
    )

    today_checkins = (
        db.query(CheckIn)
        .filter(
            CheckIn.channel_id == channel_id,
            CheckIn.checked_in_at >= start,
            CheckIn.checked_in_at < end,
        )
        .all()
    )

    checkin_map: dict[int, datetime] = {}
    for ci in today_checkins:
        existing = checkin_map.get(ci.user_id)
        if existing is None or ci.checked_in_at > existing:
            checkin_map[ci.user_id] = ci.checked_in_at

    result = []
    for cm in members:
        user = cm.user
        last_at = checkin_map.get(user.id)
        result.append(
            {
                "user_id": user.id,
                "username": user.username,
                "avatar_url": user.avatar_url,
                "checked_in": last_at is not None,
                "last_checkin_at": last_at,
            }
        )
    return result


def get_user_heatmap(
    db: Session,
    user_id: int,
    channel_id: int | None = None,
    year: int | None = None,
) -> list[dict]:
    if year is None:
        year = datetime.now(timezone.utc).year

    start = datetime(year, 1, 1)
    end = datetime(year + 1, 1, 1)

    query = db.query(
        cast(CheckIn.checked_in_at, Date).label("date"),
        func.count(CheckIn.id).label("count"),
    ).filter(
        CheckIn.user_id == user_id,
        CheckIn.checked_in_at >= start,
        CheckIn.checked_in_at < end,
    )

    if channel_id is not None:
        query = query.filter(CheckIn.channel_id == channel_id)

    rows = query.group_by(cast(CheckIn.checked_in_at, Date)).all()

    return [{"date": row.date.isoformat(), "count": row.count} for row in rows]


def get_user_streak(db: Session, user_id: int, channel_id: int) -> int:
    rows = (
        db.query(cast(CheckIn.checked_in_at, Date).label("d"))
        .filter(
            CheckIn.user_id == user_id,
            CheckIn.channel_id == channel_id,
        )
        .group_by(cast(CheckIn.checked_in_at, Date))
        .order_by(cast(CheckIn.checked_in_at, Date).desc())
        .all()
    )

    if not rows:
        return 0

    today = datetime.now(timezone.utc).date()
    dates = [row.d for row in rows]

    # Streak must include today or yesterday to be active
    if dates[0] != today and dates[0] != today - timedelta(days=1):
        return 0

    streak = 1
    for i in range(1, len(dates)):
        if dates[i - 1] - dates[i] == timedelta(days=1):
            streak += 1
        else:
            break

    return streak


def get_user_profile(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()
