import json

from sqlalchemy.orm import Session, joinedload

from app.models.channel import Channel
from app.models.channel_member import ChannelMember


def create_channel(
    db: Session,
    server_id: int,
    name: str,
    description: str | None,
    target_unit: str | None,
    target_label: str | None,
    created_by: int,
    kind: str = "numeric",
    items: list | None = None,
) -> Channel:
    # Normalize items so they're plain JSON: strings stay as strings,
    # Pydantic models (ChannelFieldItem) get dumped to plain dicts. This lets
    # the schema accept Union[str, ChannelFieldItem] without breaking json.dumps.
    serialized_items = None
    if items:
        serialized = []
        for it in items:
            if hasattr(it, "model_dump"):
                serialized.append(it.model_dump(exclude_none=True))
            elif isinstance(it, dict):
                serialized.append(it)
            else:
                serialized.append(str(it))
        serialized_items = json.dumps(serialized)
    channel = Channel(
        server_id=server_id,
        name=name,
        description=description,
        target_unit=target_unit,
        target_label=target_label,
        kind=kind,
        items=serialized_items,
        created_by=created_by,
    )
    db.add(channel)
    db.flush()

    # Auto-join creator
    member = ChannelMember(user_id=created_by, channel_id=channel.id)
    db.add(member)
    db.commit()
    db.refresh(channel)
    return channel


def get_server_channels(db: Session, server_id: int) -> list[Channel]:
    return db.query(Channel).filter(Channel.server_id == server_id).all()


def get_channel(db: Session, channel_id: int) -> Channel | None:
    return db.query(Channel).filter(Channel.id == channel_id).first()


def join_channel(db: Session, user_id: int, channel_id: int) -> ChannelMember:
    """Idempotent join. Returns the membership row regardless of whether it
    was just created or already existed. Use `join_channel_with_status` if
    you need to know."""
    member, _ = join_channel_with_status(db, user_id, channel_id)
    return member


def join_channel_with_status(
    db: Session, user_id: int, channel_id: int
) -> tuple[ChannelMember, bool]:
    """Idempotent join that also reports whether this was a fresh join.
    Returns (membership, is_new). Callers can use is_new to fire welcome
    side-effects only on the first join."""
    existing = check_channel_membership(db, user_id, channel_id)
    if existing is not None:
        return existing, False
    member = ChannelMember(user_id=user_id, channel_id=channel_id)
    db.add(member)
    db.commit()
    db.refresh(member)
    return member, True


def leave_channel(db: Session, user_id: int, channel_id: int) -> bool:
    member = check_channel_membership(db, user_id, channel_id)
    if member is None:
        return False
    db.delete(member)
    db.commit()
    return True


def get_channel_members(db: Session, channel_id: int) -> list[ChannelMember]:
    return (
        db.query(ChannelMember)
        .options(joinedload(ChannelMember.user))
        .filter(ChannelMember.channel_id == channel_id)
        .all()
    )


def check_channel_membership(
    db: Session, user_id: int, channel_id: int
) -> ChannelMember | None:
    return (
        db.query(ChannelMember)
        .filter(
            ChannelMember.user_id == user_id,
            ChannelMember.channel_id == channel_id,
        )
        .first()
    )
