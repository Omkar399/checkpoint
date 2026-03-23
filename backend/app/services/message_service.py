from sqlalchemy.orm import Session, joinedload

from app.models.message import Message


def create_message(
    db: Session,
    channel_id: int,
    user_id: int,
    content: str,
    message_type: str = "text",
) -> Message:
    message = Message(
        channel_id=channel_id,
        user_id=user_id,
        content=content,
        message_type=message_type,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    # Eagerly load user relationship
    return (
        db.query(Message)
        .options(joinedload(Message.user))
        .filter(Message.id == message.id)
        .first()
    )


def get_messages(
    db: Session,
    channel_id: int,
    before_id: int | None = None,
    limit: int = 50,
) -> list[Message]:
    query = (
        db.query(Message)
        .options(joinedload(Message.user))
        .filter(Message.channel_id == channel_id)
    )
    if before_id is not None:
        query = query.filter(Message.id < before_id)
    return query.order_by(Message.created_at.desc()).limit(limit).all()


def get_messages_after(
    db: Session, channel_id: int, after_id: int
) -> list[Message]:
    return (
        db.query(Message)
        .options(joinedload(Message.user))
        .filter(Message.channel_id == channel_id, Message.id > after_id)
        .order_by(Message.created_at.asc())
        .all()
    )
