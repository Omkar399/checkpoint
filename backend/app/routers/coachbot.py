from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.services import coachbot_service, server_service

router = APIRouter(prefix="/api/v1", tags=["coachbot"])


@router.post("/servers/{server_id}/coachbot/summary")
def trigger_daily_summary(
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
    messages = coachbot_service.generate_daily_summary(db, server_id)
    return {"sent": len(messages)}


@router.post("/servers/{server_id}/coachbot/nudge")
def trigger_nudges(
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
    messages = coachbot_service.send_inactivity_nudges(db, server_id)
    return {"sent": len(messages)}
