from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.invite import CreateInviteRequest, InviteResponse
from app.schemas.server import ServerResponse
from app.services import invite_service, server_service

router = APIRouter(prefix="/api/v1", tags=["invites"])


@router.post(
    "/servers/{server_id}/invites", response_model=InviteResponse
)
def create_invite(
    server_id: int,
    req: CreateInviteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership = server_service.check_membership(db, current_user.id, server_id)
    if membership is None or membership.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the server owner can create invites",
        )
    invite = invite_service.create_invite(
        db,
        server_id=server_id,
        created_by=current_user.id,
        max_uses=req.max_uses,
        expires_in_hours=req.expires_in_hours,
    )
    return invite


@router.get(
    "/servers/{server_id}/invites", response_model=list[InviteResponse]
)
def list_invites(
    server_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership = server_service.check_membership(db, current_user.id, server_id)
    if membership is None or membership.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the server owner can view invites",
        )
    return invite_service.get_server_invites(db, server_id)


@router.post("/invites/{code}/join", response_model=ServerResponse)
def join_via_invite(
    code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    server = invite_service.use_invite(db, code=code, user_id=current_user.id)
    if server is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid, expired, or maxed-out invite",
        )
    return server
