from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.server import CreateServerRequest, ServerResponse, ServerMemberResponse
from app.services import server_service

router = APIRouter(prefix="/api/v1", tags=["servers"])


@router.post("/servers", response_model=ServerResponse)
def create_server(
    req: CreateServerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    server = server_service.create_server(
        db, name=req.name, description=req.description, owner_id=current_user.id
    )
    return server


@router.get("/servers", response_model=list[ServerResponse])
def list_servers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return server_service.get_user_servers(db, current_user.id)


@router.get("/servers/{server_id}", response_model=ServerResponse)
def get_server(
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
    server = server_service.get_server(db, server_id)
    if server is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Server not found"
        )
    return server


@router.get("/servers/{server_id}/members", response_model=list[ServerMemberResponse])
def list_members(
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
    return server_service.get_server_members(db, server_id)


@router.delete("/servers/{server_id}/members/me", status_code=status.HTTP_204_NO_CONTENT)
def leave_server(
    server_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = server_service.leave_server(db, current_user.id, server_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot leave server (you may be the owner or not a member)",
        )
