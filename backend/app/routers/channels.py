from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.channel import (
    CreateChannelRequest,
    ChannelResponse,
    ChannelMemberResponse,
)
from app.services import channel_service, server_service

router = APIRouter(prefix="/api/v1", tags=["channels"])


@router.post(
    "/servers/{server_id}/channels", response_model=ChannelResponse
)
def create_channel(
    server_id: int,
    req: CreateChannelRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership = server_service.check_membership(db, current_user.id, server_id)
    if membership is None or membership.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the server owner can create channels",
        )
    channel = channel_service.create_channel(
        db,
        server_id=server_id,
        name=req.name,
        description=req.description,
        target_unit=req.target_unit,
        target_label=req.target_label,
        created_by=current_user.id,
    )
    return channel


@router.get(
    "/servers/{server_id}/channels", response_model=list[ChannelResponse]
)
def list_channels(
    server_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership = server_service.check_membership(db, current_user.id, server_id)
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this server",
        )
    return channel_service.get_server_channels(db, server_id)


@router.get("/channels/{channel_id}", response_model=ChannelResponse)
def get_channel(
    channel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    channel = channel_service.get_channel(db, channel_id)
    if channel is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found"
        )
    # Must be a member of the server
    membership = server_service.check_membership(
        db, current_user.id, channel.server_id
    )
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this server",
        )
    return channel


@router.post("/channels/{channel_id}/join", response_model=ChannelMemberResponse)
def join_channel(
    channel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    channel = channel_service.get_channel(db, channel_id)
    if channel is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found"
        )
    membership = server_service.check_membership(
        db, current_user.id, channel.server_id
    )
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this server",
        )
    cm = channel_service.join_channel(db, current_user.id, channel_id)
    # Reload with user
    from sqlalchemy.orm import joinedload
    from app.models.channel_member import ChannelMember

    cm = (
        db.query(ChannelMember)
        .options(joinedload(ChannelMember.user))
        .filter(ChannelMember.id == cm.id)
        .first()
    )
    return cm


@router.delete(
    "/channels/{channel_id}/members/me", status_code=status.HTTP_204_NO_CONTENT
)
def leave_channel(
    channel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = channel_service.leave_channel(db, current_user.id, channel_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not a member of this channel",
        )


@router.get(
    "/channels/{channel_id}/members", response_model=list[ChannelMemberResponse]
)
def list_channel_members(
    channel_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    channel = channel_service.get_channel(db, channel_id)
    if channel is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found"
        )
    membership = server_service.check_membership(
        db, current_user.id, channel.server_id
    )
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this server",
        )
    return channel_service.get_channel_members(db, channel_id)
