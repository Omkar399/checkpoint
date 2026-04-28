import json
from datetime import datetime, date, timezone, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.checkin import CheckIn
from app.models.channel_member import ChannelMember
from app.models.user import User
from app.models.reaction import Reaction


def create_checkin(
    db: Session,
    user_id: int,
    channel_id: int,
    value: float | None = None,
    note: str | None = None,
    checked_items: list[int] | None = None,
    field_states: list[dict] | None = None,
) -> CheckIn:
    checkin = CheckIn(
        user_id=user_id,
        channel_id=channel_id,
        value=value,
        note=note,
        checked_items=json.dumps(checked_items) if checked_items is not None else None,
        field_states=json.dumps(field_states) if field_states is not None else None,
    )
    db.add(checkin)
    db.commit()
    db.refresh(checkin)
    return (
        db.query(CheckIn)
        .options(joinedload(CheckIn.user), joinedload(CheckIn.reactions).joinedload(Reaction.user))
        .filter(CheckIn.id == checkin.id)
        .first()
    )


def parse_checked_items(raw: str | None) -> list[int] | None:
    if not raw:
        return None
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return [int(i) for i in parsed if isinstance(i, (int, float)) and not isinstance(i, bool)]
    except (json.JSONDecodeError, ValueError, TypeError):
        return None
    return None


def parse_field_states(raw: str | None) -> list[dict] | None:
    """Parse the field_states JSON blob into a list of {idx, checked?, value?} dicts."""
    if not raw:
        return None
    try:
        parsed = json.loads(raw)
    except (json.JSONDecodeError, ValueError, TypeError):
        return None
    if not isinstance(parsed, list):
        return None
    out: list[dict] = []
    for entry in parsed:
        if not isinstance(entry, dict):
            continue
        idx = entry.get("idx")
        if not isinstance(idx, (int, float)) or isinstance(idx, bool):
            continue
        item: dict = {"idx": int(idx)}
        if "checked" in entry and isinstance(entry["checked"], bool):
            item["checked"] = entry["checked"]
        if "value" in entry and isinstance(entry["value"], (int, float)) and not isinstance(entry["value"], bool):
            item["value"] = float(entry["value"])
        out.append(item)
    return out


def get_channel_checkins(
    db: Session,
    channel_id: int,
    target_date: date | None = None,
    limit: int = 50,
) -> list[CheckIn]:
    query = (
        db.query(CheckIn)
        .options(joinedload(CheckIn.user), joinedload(CheckIn.reactions).joinedload(Reaction.user))
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

    day_expr = func.date(CheckIn.checked_in_at)
    query = db.query(
        day_expr.label("day"),
        func.count(CheckIn.id).label("count"),
    ).filter(
        CheckIn.user_id == user_id,
        CheckIn.checked_in_at >= start,
        CheckIn.checked_in_at < end,
    )

    if channel_id is not None:
        query = query.filter(CheckIn.channel_id == channel_id)

    rows = query.group_by(day_expr).all()

    def _to_iso(v) -> str:
        if isinstance(v, str):
            return v
        if hasattr(v, "isoformat"):
            return v.isoformat()
        return str(v)

    return [{"date": _to_iso(row.day), "count": row.count} for row in rows]


def get_user_streak(db: Session, user_id: int, channel_id: int) -> int:
    day_expr = func.date(CheckIn.checked_in_at)
    rows = (
        db.query(day_expr.label("d"))
        .filter(
            CheckIn.user_id == user_id,
            CheckIn.channel_id == channel_id,
        )
        .group_by(day_expr)
        .order_by(day_expr.desc())
        .all()
    )

    if not rows:
        return 0

    def _to_date(v) -> date:
        if isinstance(v, date):
            return v
        return date.fromisoformat(str(v))

    today = datetime.now(timezone.utc).date()
    dates = [_to_date(row.d) for row in rows]

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
