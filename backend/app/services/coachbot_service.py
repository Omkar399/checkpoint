from datetime import datetime, timezone, timedelta

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.message import Message
from app.models.checkin import CheckIn
from app.models.channel_member import ChannelMember
from app.models.channel import Channel
from app.models.membership import ServerMember

COACHBOT_USERNAME = "Coach Bot"
COACHBOT_EMAIL = "coachbot@checkpoint.local"


def get_or_create_bot(db: Session) -> User:
    bot = db.query(User).filter(User.username == COACHBOT_USERNAME).first()
    if bot:
        return bot

    bot = User(
        email=COACHBOT_EMAIL,
        username=COACHBOT_USERNAME,
        password_hash="!disabled!",
        avatar_url=None,
    )
    db.add(bot)
    db.commit()
    db.refresh(bot)
    return bot


def send_bot_message(db: Session, channel_id: int, content: str) -> Message:
    bot = get_or_create_bot(db)
    msg = Message(
        channel_id=channel_id,
        user_id=bot.id,
        content=content,
        message_type="bot",
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def send_welcome_message(db: Session, *, user, server) -> None:
    """Post a welcome message to the server's first channel for the new joiner.

    Picks the oldest channel by created_at. Skips silently if there are no
    channels yet. Failures are swallowed (logged via print) so a flaky welcome
    can't block the join.
    """
    try:
        first_channel = (
            db.query(Channel)
            .filter(Channel.server_id == server.id)
            .order_by(Channel.created_at.asc())
            .first()
        )
        if first_channel is None:
            return

        content = (
            f"Welcome @{user.username} - happy to have you in {server.name}. "
            f"Pick a channel and log your first check-in. "
            f"Streaks start with one entry."
        )
        send_bot_message(db, first_channel.id, content)
    except Exception as exc:
        print(f"[coachbot] welcome message failed: {exc}")


def generate_daily_summary(db: Session, server_id: int) -> list[Message]:
    yesterday = datetime.now(timezone.utc).date() - timedelta(days=1)
    start = datetime.combine(yesterday, datetime.min.time())
    end = start + timedelta(days=1)

    channels = (
        db.query(Channel).filter(Channel.server_id == server_id).all()
    )

    messages = []
    for channel in channels:
        member_count = (
            db.query(ChannelMember)
            .filter(ChannelMember.channel_id == channel.id)
            .count()
        )

        checkin_count = (
            db.query(CheckIn)
            .filter(
                CheckIn.channel_id == channel.id,
                CheckIn.checked_in_at >= start,
                CheckIn.checked_in_at < end,
            )
            .count()
        )

        unique_users = (
            db.query(CheckIn.user_id)
            .filter(
                CheckIn.channel_id == channel.id,
                CheckIn.checked_in_at >= start,
                CheckIn.checked_in_at < end,
            )
            .distinct()
            .count()
        )

        if member_count == 0:
            continue

        pct = round((unique_users / member_count) * 100)
        content = (
            f"Daily Summary for **#{channel.name}** ({yesterday.strftime('%b %d')}):\n"
            f"- {unique_users}/{member_count} members checked in ({pct}%)\n"
            f"- {checkin_count} total check-ins recorded\n"
        )

        if pct == 100:
            content += "Everyone showed up! Great work, team!"
        elif pct >= 75:
            content += "Strong showing! Let's aim for 100% today."
        elif pct > 0:
            content += "Let's pick it up today, team!"
        else:
            content += "No check-ins yesterday. Today is a fresh start!"

        msg = send_bot_message(db, channel.id, content)
        messages.append(msg)

    return messages


def send_inactivity_nudges(db: Session, server_id: int) -> list[Message]:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=48)

    channels = (
        db.query(Channel).filter(Channel.server_id == server_id).all()
    )

    messages = []
    for channel in channels:
        members = (
            db.query(ChannelMember)
            .filter(ChannelMember.channel_id == channel.id)
            .all()
        )

        bot = get_or_create_bot(db)

        for member in members:
            if member.user_id == bot.id:
                continue

            latest_checkin = (
                db.query(CheckIn)
                .filter(
                    CheckIn.user_id == member.user_id,
                    CheckIn.channel_id == channel.id,
                )
                .order_by(CheckIn.checked_in_at.desc())
                .first()
            )

            needs_nudge = False
            if latest_checkin is None:
                # Never checked in and joined more than 48h ago
                if member.joined_at and member.joined_at < cutoff:
                    needs_nudge = True
            elif latest_checkin.checked_in_at < cutoff:
                needs_nudge = True

            if needs_nudge:
                user = db.query(User).filter(User.id == member.user_id).first()
                if user:
                    content = (
                        f"Hey **{user.username}**, it's been a while since your last check-in "
                        f"in **#{channel.name}**. Don't break your momentum - check in today!"
                    )
                    msg = send_bot_message(db, channel.id, content)
                    messages.append(msg)

    return messages
