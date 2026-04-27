from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.checkin import CheckIn
from app.schemas.reaction import ReactionCreate, ReactionResponse, ReactionSummary
from app.services import reaction_service, channel_service

router = APIRouter(prefix="/api/v1", tags=["reactions"])


def _require_checkin_access(db: Session, user_id: int, checkin_id: int) -> CheckIn:
    checkin = db.query(CheckIn).filter(CheckIn.id == checkin_id).first()
    if checkin is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Check-in not found"
        )
    cm = channel_service.check_channel_membership(db, user_id, checkin.channel_id)
    if cm is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this channel",
        )
    return checkin


@router.post("/checkins/{checkin_id}/reactions", response_model=ReactionResponse)
def add_reaction(
    checkin_id: int,
    req: ReactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_checkin_access(db, current_user.id, checkin_id)
    return reaction_service.add_reaction(
        db, checkin_id=checkin_id, user_id=current_user.id, emoji=req.emoji
    )


@router.delete(
    "/checkins/{checkin_id}/reactions/{emoji}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_reaction(
    checkin_id: int,
    emoji: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_checkin_access(db, current_user.id, checkin_id)
    removed = reaction_service.remove_reaction(
        db, checkin_id=checkin_id, user_id=current_user.id, emoji=emoji
    )
    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Reaction not found"
        )


@router.get(
    "/checkins/{checkin_id}/reactions",
    response_model=list[ReactionSummary],
)
def get_reactions(
    checkin_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_checkin_access(db, current_user.id, checkin_id)
    return reaction_service.get_checkin_reactions(
        db, checkin_id=checkin_id, current_user_id=current_user.id
    )
