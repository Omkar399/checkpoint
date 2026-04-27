"""Seed demo data into the existing Run/Daily running channel.

Adds 4 peer users, joins them to the server + channel, and backfills 30 days
of check-ins, messages, and reactions for all 5 members (demo + peers).

Usage (from backend/ with venv activated):
    python -m scripts.seed_demo
"""

from __future__ import annotations

import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Allow `python scripts/seed_demo.py` from the backend dir
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.database import SessionLocal  # noqa: E402
from app.models.user import User  # noqa: E402
from app.models.server import Server  # noqa: E402
from app.models.membership import ServerMember  # noqa: E402
from app.models.channel import Channel  # noqa: E402
from app.models.channel_member import ChannelMember  # noqa: E402
from app.models.checkin import CheckIn  # noqa: E402
from app.models.message import Message  # noqa: E402
from app.models.reaction import Reaction  # noqa: E402
from app.services.auth_service import hash_password  # noqa: E402

# Deterministic randomness so re-runs are stable
random.seed(2026)

PEERS = [
    {
        "email": "anmol@example.com",
        "username": "anmol",
        "password": "demo1234",
        # consistency: 0..1, higher = more days active
        "consistency": 0.85,
        # value range in km
        "value_range": (4.0, 7.5),
        "notes": [
            "Easy 5k to start the week.",
            "Tempo run — felt strong.",
            "Trail loop with the crew.",
            "Quick recovery jog.",
            "Hill repeats. Brutal.",
            "Long run — 8k under 40m.",
            "Speedwork at the track.",
        ],
    },
    {
        "email": "priya@example.com",
        "username": "priya",
        "password": "demo1234",
        "consistency": 0.6,
        "value_range": (3.0, 5.5),
        "notes": [
            "Couch-to-5k week 4.",
            "Slow but consistent.",
            "Made it out before sunrise!",
            "Got through it — knee felt better.",
            "Hot day, took it easy.",
            "Ran with anmol — pushed myself.",
        ],
    },
    {
        "email": "sam@example.com",
        "username": "sam",
        "password": "demo1234",
        "consistency": 0.92,
        "value_range": (5.0, 10.0),
        "notes": [
            "Marathon block week 6.",
            "Long slow distance.",
            "Threshold intervals.",
            "Pre-dawn 10k.",
            "Easy shakeout.",
            "Race pace tune-up.",
            "Negative splits today!",
        ],
    },
    {
        "email": "alex@example.com",
        "username": "alex",
        "password": "demo1234",
        "consistency": 0.45,
        "value_range": (3.0, 5.0),
        "notes": [
            "Back at it.",
            "Squeezed in 3k at lunch.",
            "Treadmill day.",
            "Just needed to move.",
        ],
    },
]

DEMO_NOTES = [
    "Quick lunch run.",
    "Felt heavy today but got it done.",
    "Crisp morning, perfect pace.",
    "5k under 25m. Personal best.",
    "Recovery jog with podcasts.",
    "Long run weekend!",
    "Track session — 6×400.",
    "Easy effort. Building base.",
]

REACTIONS = ["🔥", "💪", "🎉", "👏", "🚀", "✅"]

CHAT_LINES = [
    ("anmol", "morning crew, who's getting out today?"),
    ("priya", "going for a slow 4k after work"),
    ("sam", "tempo run on the schedule. wish me luck"),
    ("demo", "first week back from injury, easing in"),
    ("anmol", "🔥 sam absolutely cooking lately"),
    ("alex", "trying to make it 3 days this week"),
    ("priya", "the heatmap is so motivating tbh"),
    ("sam", "anyone else doing the half marathon next month?"),
    ("demo", "yes! signed up last weekend"),
    ("anmol", "lfg. 👀"),
]


def upsert_user(db, email, username, password) -> User:
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        return existing
    user = User(email=email, username=username, password_hash=hash_password(password))
    db.add(user)
    db.flush()
    return user


def ensure_server_member(db, user_id: int, server_id: int, role: str = "member"):
    existing = (
        db.query(ServerMember)
        .filter(ServerMember.user_id == user_id, ServerMember.server_id == server_id)
        .first()
    )
    if existing:
        return existing
    sm = ServerMember(user_id=user_id, server_id=server_id, role=role)
    db.add(sm)
    db.flush()
    return sm


def ensure_channel_member(db, user_id: int, channel_id: int):
    existing = (
        db.query(ChannelMember)
        .filter(ChannelMember.user_id == user_id, ChannelMember.channel_id == channel_id)
        .first()
    )
    if existing:
        return existing
    cm = ChannelMember(user_id=user_id, channel_id=channel_id)
    db.add(cm)
    db.flush()
    return cm


def midnight_utc(d: datetime) -> datetime:
    return d.replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=timezone.utc)


def seed_checkins(db, channel_id: int, user_id: int, profile: dict, days: int = 30):
    """Backfill `days` of check-ins. Returns list of (checkin_id, day_offset)."""
    today = midnight_utc(datetime.now(timezone.utc))
    created = []
    for offset in range(days, -1, -1):
        if random.random() > profile["consistency"]:
            continue
        # Pick a time-of-day for this check-in: morning, lunch, or evening
        slot = random.choice([6, 12, 18, 19, 20])
        ts = today - timedelta(days=offset)
        ts = ts.replace(hour=slot, minute=random.randint(0, 59), second=random.randint(0, 59))
        # Avoid duplicates if rerun
        existing = (
            db.query(CheckIn)
            .filter(
                CheckIn.user_id == user_id,
                CheckIn.channel_id == channel_id,
                CheckIn.checked_in_at >= ts.replace(hour=0, minute=0, second=0),
                CheckIn.checked_in_at < (ts.replace(hour=0, minute=0, second=0) + timedelta(days=1)),
            )
            .first()
        )
        if existing:
            created.append((existing.id, offset))
            continue
        lo, hi = profile["value_range"]
        value = round(random.uniform(lo, hi), 1)
        note = random.choice(profile["notes"]) if random.random() < 0.7 else None
        ci = CheckIn(
            user_id=user_id,
            channel_id=channel_id,
            value=value,
            note=note,
            checked_in_at=ts,
        )
        db.add(ci)
        db.flush()
        created.append((ci.id, offset))
    return created


def sprinkle_reactions(db, checkin_ids_by_offset, all_user_ids):
    """Add reactions on roughly 40% of recent check-ins from random other users."""
    # Take recent (offset <= 14) check-ins
    recent = [cid for cid, off in checkin_ids_by_offset if off <= 14]
    for cid in recent:
        if random.random() > 0.4:
            continue
        # 1-3 distinct emoji reactions from other users
        emoji_count = random.randint(1, 3)
        reactors = random.sample(all_user_ids, min(emoji_count + 1, len(all_user_ids)))
        chosen_emojis = random.sample(REACTIONS, emoji_count)
        for emoji in chosen_emojis:
            for uid in reactors[:emoji_count]:
                # Each user reacts with this emoji once (max)
                existing = (
                    db.query(Reaction)
                    .filter(
                        Reaction.checkin_id == cid,
                        Reaction.user_id == uid,
                        Reaction.emoji == emoji,
                    )
                    .first()
                )
                if existing:
                    continue
                db.add(Reaction(checkin_id=cid, user_id=uid, emoji=emoji))
    db.flush()


def seed_messages(db, channel_id: int, username_to_id: dict[str, int]):
    """Add a small chat thread, but only if the channel has fewer than 5 messages."""
    if db.query(Message).filter(Message.channel_id == channel_id).count() >= 5:
        return
    base = datetime.now(timezone.utc) - timedelta(hours=8)
    for i, (uname, content) in enumerate(CHAT_LINES):
        uid = username_to_id.get(uname)
        if uid is None:
            continue
        ts = base + timedelta(minutes=i * 7 + random.randint(0, 4))
        msg = Message(
            channel_id=channel_id,
            user_id=uid,
            content=content,
            message_type="text",
            created_at=ts,
        )
        db.add(msg)
    db.flush()


def main():
    db = SessionLocal()
    try:
        # Anchor on the existing Run/Daily running for demo (#7)
        demo = db.query(User).filter(User.email == "demo@example.com").first()
        if demo is None:
            print("✗ demo@example.com not found — aborting.")
            return
        server = db.query(Server).filter(Server.owner_id == demo.id, Server.name == "Run").first()
        if server is None:
            print("✗ 'Run' server (owned by demo) not found — aborting.")
            return
        channel = (
            db.query(Channel)
            .filter(Channel.server_id == server.id, Channel.name == "Daily running")
            .first()
        )
        if channel is None:
            print("✗ 'Daily running' channel not found — aborting.")
            return

        print(f"→ Seeding into server #{server.id} '{server.name}', channel #{channel.id} '{channel.name}'")

        # Make sure demo is a server + channel member (defensive)
        ensure_server_member(db, demo.id, server.id, role="owner")
        ensure_channel_member(db, demo.id, channel.id)

        # Create or fetch peers
        peer_users: list[tuple[User, dict]] = []
        for p in PEERS:
            u = upsert_user(db, p["email"], p["username"], p["password"])
            ensure_server_member(db, u.id, server.id, role="member")
            ensure_channel_member(db, u.id, channel.id)
            peer_users.append((u, p))
        db.commit()
        print(f"✓ {len(peer_users)} peer users joined")

        # Backfill check-ins
        all_user_ids = [demo.id] + [u.id for u, _ in peer_users]
        all_checkin_offsets: list[tuple[int, int]] = []

        # Demo: 75% consistency, 4-7km
        demo_profile = {
            "consistency": 0.75,
            "value_range": (4.0, 7.0),
            "notes": DEMO_NOTES,
        }
        all_checkin_offsets.extend(seed_checkins(db, channel.id, demo.id, demo_profile))

        for u, p in peer_users:
            all_checkin_offsets.extend(seed_checkins(db, channel.id, u.id, p))

        db.commit()
        print(f"✓ {len(all_checkin_offsets)} check-ins backfilled (some may have already existed)")

        # Reactions on recent check-ins
        sprinkle_reactions(db, all_checkin_offsets, all_user_ids)
        db.commit()
        rxn_count = db.query(Reaction).filter(
            Reaction.checkin_id.in_([cid for cid, _ in all_checkin_offsets])
        ).count()
        print(f"✓ {rxn_count} reactions in place")

        # Chat messages
        username_to_id = {u.username: u.id for u, _ in peer_users}
        username_to_id["demo"] = demo.id
        seed_messages(db, channel.id, username_to_id)
        db.commit()
        msg_count = db.query(Message).filter(Message.channel_id == channel.id).count()
        print(f"✓ {msg_count} total messages in channel")

        print()
        print("Demo accounts (all password: demo1234):")
        print(f"  demo@example.com  (owner)")
        for u, _ in peer_users:
            print(f"  {u.email}")
        print()
        print("Done. Refresh the channel to see the activity.")

    finally:
        db.close()


if __name__ == "__main__":
    main()
