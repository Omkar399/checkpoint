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
) -> Channel:
    channel = Channel(
        server_id=server_id,
        name=name,
        description=description,
        target_unit=target_unit,
        target_label=target_label,
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
    existing = check_channel_membership(db, user_id, channel_id)
    if existing is not None:
        return existing
    member = ChannelMember(user_id=user_id, channel_id=channel_id)
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


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
