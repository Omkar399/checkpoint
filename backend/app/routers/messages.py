from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.message import CreateMessageRequest, MessageResponse
from app.services import channel_service, message_service, server_service

router = APIRouter(prefix="/api/v1", tags=["messages"])


def _require_channel_member(db: Session, user_id: int, channel_id: int):
    """Verify user is a member of the channel (and implicitly the server)."""
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
    "/channels/{channel_id}/messages", response_model=MessageResponse
)
def send_message(
    channel_id: int,
    req: CreateMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_channel_member(db, current_user.id, channel_id)
    msg = message_service.create_message(
        db, channel_id=channel_id, user_id=current_user.id, content=req.content
    )
    return msg


@router.get(
    "/channels/{channel_id}/messages", response_model=list[MessageResponse]
)
def get_messages(
    channel_id: int,
    before: int | None = Query(default=None),
    limit: int = Query(default=50, le=100, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_channel_member(db, current_user.id, channel_id)
    return message_service.get_messages(
        db, channel_id=channel_id, before_id=before, limit=limit
    )


@router.get(
    "/channels/{channel_id}/messages/poll", response_model=list[MessageResponse]
)
def poll_messages(
    channel_id: int,
    after: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_channel_member(db, current_user.id, channel_id)
    return message_service.get_messages_after(
        db, channel_id=channel_id, after_id=after
    )
