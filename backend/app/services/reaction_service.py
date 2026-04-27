from sqlalchemy.orm import Session, joinedload

from app.models.reaction import Reaction


def add_reaction(
    db: Session, checkin_id: int, user_id: int, emoji: str
) -> Reaction:
    existing = (
        db.query(Reaction)
        .filter(
            Reaction.checkin_id == checkin_id,
            Reaction.user_id == user_id,
            Reaction.emoji == emoji,
        )
        .first()
    )
    if existing:
        return (
            db.query(Reaction)
            .options(joinedload(Reaction.user))
            .filter(Reaction.id == existing.id)
            .first()
        )

    reaction = Reaction(checkin_id=checkin_id, user_id=user_id, emoji=emoji)
    db.add(reaction)
    db.commit()
    db.refresh(reaction)
    return (
        db.query(Reaction)
        .options(joinedload(Reaction.user))
        .filter(Reaction.id == reaction.id)
        .first()
    )


def remove_reaction(db: Session, checkin_id: int, user_id: int, emoji: str) -> bool:
    reaction = (
        db.query(Reaction)
        .filter(
            Reaction.checkin_id == checkin_id,
            Reaction.user_id == user_id,
            Reaction.emoji == emoji,
        )
        .first()
    )
    if reaction is None:
        return False
    db.delete(reaction)
    db.commit()
    return True


def get_checkin_reactions(
    db: Session, checkin_id: int, current_user_id: int
) -> list[dict]:
    reactions = (
        db.query(Reaction)
        .options(joinedload(Reaction.user))
        .filter(Reaction.checkin_id == checkin_id)
        .all()
    )

    emoji_map: dict[str, dict] = {}
    for r in reactions:
        if r.emoji not in emoji_map:
            emoji_map[r.emoji] = {"emoji": r.emoji, "count": 0, "users": [], "reacted_by_me": False}
        emoji_map[r.emoji]["count"] += 1
        emoji_map[r.emoji]["users"].append(r.user.username)
        if r.user_id == current_user_id:
            emoji_map[r.emoji]["reacted_by_me"] = True

    return list(emoji_map.values())
