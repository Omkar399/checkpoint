import random
import string
from datetime import datetime, timezone, timedelta

from sqlalchemy.orm import Session

from app.models.invite import Invite
from app.models.membership import ServerMember
from app.models.server import Server


def _generate_code(length: int = 8) -> str:
    return "".join(random.choices(string.ascii_letters + string.digits, k=length))


def create_invite(
    db: Session,
    server_id: int,
    created_by: int,
    max_uses: int | None = None,
    expires_in_hours: int | None = None,
) -> Invite:
    code = _generate_code()
    # Ensure uniqueness
    while db.query(Invite).filter(Invite.code == code).first() is not None:
        code = _generate_code()

    expires_at = None
    if expires_in_hours is not None:
        expires_at = datetime.now(timezone.utc) + timedelta(hours=expires_in_hours)

    invite = Invite(
        code=code,
        server_id=server_id,
        created_by=created_by,
        max_uses=max_uses,
        expires_at=expires_at,
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return invite


def get_server_invites(db: Session, server_id: int) -> list[Invite]:
    return db.query(Invite).filter(Invite.server_id == server_id).all()


def use_invite(db: Session, code: str, user_id: int) -> Server | None:
    invite = db.query(Invite).filter(Invite.code == code).first()
    if invite is None:
        return None

    # Check expiration
    if invite.expires_at is not None and datetime.now(timezone.utc) > invite.expires_at:
        return None

    # Check max uses
    if invite.max_uses is not None and invite.use_count >= invite.max_uses:
        return None

    # Check if user is already a member
    existing = (
        db.query(ServerMember)
        .filter(
            ServerMember.user_id == user_id,
            ServerMember.server_id == invite.server_id,
        )
        .first()
    )
    if existing is not None:
        # Already a member, just return the server
        return db.query(Server).filter(Server.id == invite.server_id).first()

    membership = ServerMember(
        user_id=user_id, server_id=invite.server_id, role="member"
    )
    db.add(membership)

    invite.use_count += 1
    db.commit()

    return db.query(Server).filter(Server.id == invite.server_id).first()
