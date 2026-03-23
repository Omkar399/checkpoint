from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.server import Server
from app.models.membership import ServerMember


def create_server(
    db: Session, name: str, description: str | None, owner_id: int
) -> Server:
    server = Server(name=name, description=description, owner_id=owner_id)
    db.add(server)
    db.flush()

    membership = ServerMember(user_id=owner_id, server_id=server.id, role="owner")
    db.add(membership)
    db.commit()
    db.refresh(server)
    return server


def get_user_servers(db: Session, user_id: int) -> list[Server]:
    server_ids = select(ServerMember.server_id).where(
        ServerMember.user_id == user_id
    )
    return db.query(Server).filter(Server.id.in_(server_ids)).all()


def get_server(db: Session, server_id: int) -> Server | None:
    return db.query(Server).filter(Server.id == server_id).first()


def get_server_members(db: Session, server_id: int) -> list[ServerMember]:
    return (
        db.query(ServerMember)
        .options(joinedload(ServerMember.user))
        .filter(ServerMember.server_id == server_id)
        .all()
    )


def check_membership(db: Session, user_id: int, server_id: int) -> ServerMember | None:
    return (
        db.query(ServerMember)
        .filter(
            ServerMember.user_id == user_id,
            ServerMember.server_id == server_id,
        )
        .first()
    )


def leave_server(db: Session, user_id: int, server_id: int) -> bool:
    membership = check_membership(db, user_id, server_id)
    if membership is None:
        return False
    if membership.role == "owner":
        return False
    db.delete(membership)
    db.commit()
    return True
