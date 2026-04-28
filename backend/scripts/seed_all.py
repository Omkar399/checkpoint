"""Single idempotent seed script for the demo dataset.

Creates (or upserts) everything needed for the demo:
  - Demo account: demo@example.com / demo1234
  - Peer users:   anmol, priya, sam, alex (all password demo1234)
  - 3 servers:    Run, College, Social
  - 7 channels:   Daily running (numeric), project-161 (numeric),
                  midterm-daa (checklist), morning-study (numeric),
                  garbage-day (binary), gym-time (numeric), call-mom (binary)
  - ~30 days of check-ins per member per channel (varied consistency)
  - Reactions on recent check-ins
  - Sample chat messages

Re-runnable: every call upserts users/servers/channels and skips already-seeded
check-ins for the same (user, channel, day). To start fresh, delete
checkpoint.db and re-run.

Usage (from backend/ with venv activated):
    python -m scripts.seed_all
"""

from __future__ import annotations

import json
import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.migrations import run_startup_migrations  # noqa: E402
from app.models.user import User  # noqa: E402
from app.models.server import Server  # noqa: E402
from app.models.membership import ServerMember  # noqa: E402
from app.models.channel import Channel  # noqa: E402
from app.models.channel_member import ChannelMember  # noqa: E402
from app.models.checkin import CheckIn  # noqa: E402
from app.models.message import Message  # noqa: E402
from app.models.reaction import Reaction  # noqa: E402
from app.services.auth_service import hash_password  # noqa: E402

random.seed(2026)

DEMO_PASSWORD = "demo1234"
REACTIONS_POOL = ["🔥", "💪", "🎉", "👏", "🚀", "✅"]


# ---------------------------------------------------------------------------
# Data definitions

USERS = [
    {"email": "demo@example.com", "username": "demo"},
    {"email": "anmol@example.com", "username": "anmol"},
    {"email": "priya@example.com", "username": "priya"},
    {"email": "sam@example.com", "username": "sam"},
    {"email": "alex@example.com", "username": "alex"},
]

DAA_CHAPTERS = [
    "Asymptotic notation",
    "Divide and conquer",
    "Sorting (merge / quick / heap)",
    "Hash tables",
    "Dynamic programming",
    "Greedy algorithms",
    "Graphs (BFS, DFS)",
    "Shortest paths (Dijkstra, Bellman-Ford)",
    "Minimum spanning trees",
    "NP-completeness",
    "Approximation algorithms",
]


SERVERS = [
    {
        "name": "Run",
        "description": "Daily running crew. Show up, log the km.",
        "owner": "demo",
        "members": ["anmol", "priya", "sam", "alex"],
        "channels": [
            {
                "name": "Daily running",
                "description": "Track your daily run in km.",
                "kind": "numeric",
                "target_unit": "km",
                "target_label": "distance",
                "items": None,
                "profiles": {
                    "demo": {"consistency": 0.75, "value": (4.0, 7.0), "notes": [
                        "Quick lunch run.",
                        "Felt heavy today but got it done.",
                        "Crisp morning, perfect pace.",
                        "5k under 25m. Personal best.",
                        "Recovery jog with podcasts.",
                    ]},
                    "anmol": {"consistency": 0.85, "value": (4.0, 7.5), "notes": [
                        "Easy 5k to start the week.",
                        "Tempo run — felt strong.",
                        "Trail loop with the crew.",
                        "Quick recovery jog.",
                    ]},
                    "priya": {"consistency": 0.6, "value": (3.0, 5.5), "notes": [
                        "Couch-to-5k week 4.",
                        "Slow but consistent.",
                        "Made it out before sunrise!",
                    ]},
                    "sam": {"consistency": 0.92, "value": (5.0, 10.0), "notes": [
                        "Marathon block week 6.",
                        "Long slow distance.",
                        "Threshold intervals.",
                    ]},
                    "alex": {"consistency": 0.45, "value": (3.0, 5.0), "notes": [
                        "Back at it.",
                        "Squeezed in 3k at lunch.",
                        "Treadmill day.",
                    ]},
                },
                "messages": [
                    ("anmol", "morning crew, who's getting out today?"),
                    ("priya", "going for a slow 4k after work"),
                    ("sam", "tempo run on the schedule. wish me luck"),
                    ("demo", "first week back from injury, easing in"),
                    ("anmol", "🔥 sam absolutely cooking lately"),
                    ("alex", "trying to make it 3 days this week"),
                    ("priya", "the heatmap is so motivating tbh"),
                ],
            },
        ],
    },
    {
        "name": "College",
        "description": "Senior year accountability. Show up for the work.",
        "owner": "demo",
        "members": ["anmol", "priya"],
        "channels": [
            {
                "name": "project-161",
                "description": "CS161 group project — hours of focused work.",
                "kind": "numeric",
                "target_unit": "hrs",
                "target_label": "deep work",
                "items": None,
                "profiles": {
                    "demo": {"consistency": 0.7, "value": (1.0, 4.5), "notes": [
                        "Pair-programmed the auth module.",
                        "Wrote the design doc draft.",
                        "Squashed the WS race condition.",
                        "Refactored the seed script.",
                        "Pushed the migration. Tests green.",
                    ]},
                    "anmol": {"consistency": 0.6, "value": (0.5, 3.5), "notes": [
                        "Sketched the schema.",
                        "Tackled the API plumbing.",
                        "Code review + a bit of writing.",
                    ]},
                    "priya": {"consistency": 0.55, "value": (1.0, 3.0), "notes": [
                        "Frontend polish session.",
                        "Wrote tests for the checkin service.",
                    ]},
                },
                "messages": [
                    ("demo", "ok crew where are we on the auth flow?"),
                    ("anmol", "almost there. need 30 more min and it's done"),
                    ("priya", "i'll start the frontend polish once auth lands"),
                    ("demo", "🔥"),
                    ("anmol", "auth merged. unit tests passing"),
                ],
            },
            {
                "name": "midterm-daa",
                "description": "Algorithms midterm prep. Tick chapters as you study.",
                "kind": "checklist",
                "target_unit": None,
                "target_label": None,
                "items": DAA_CHAPTERS,
                "profiles": {
                    "demo": {"consistency": 0.8, "checklist_range": (1, 4), "notes": [
                        "DP problems. Got 3 of 5.",
                        "Re-read graph algorithms.",
                        "Mock exam under timer. 78%.",
                        "NP-complete reductions. Painful but learning.",
                    ]},
                    "anmol": {"consistency": 0.85, "checklist_range": (2, 5), "notes": [
                        "Wrote out master theorem proofs.",
                        "Practice problems in the library.",
                        "Mock exam — feeling OK about it.",
                    ]},
                    "priya": {"consistency": 0.7, "checklist_range": (1, 3), "notes": [
                        "Reviewed dynamic programming.",
                        "Late night cram session.",
                    ]},
                },
                "messages": [
                    ("priya", "anyone struggling with the DP problem?"),
                    ("anmol", "yeah took me forever. happy to walk through it"),
                    ("demo", "library at 7?"),
                    ("priya", "i'll be there"),
                ],
            },
            {
                "name": "morning-study",
                "description": "Up early, lock in. 60 min before class.",
                "kind": "numeric",
                "target_unit": "min",
                "target_label": "focus",
                "items": None,
                "profiles": {
                    "demo": {"consistency": 0.55, "value": (30, 90), "notes": [
                        "Made it out of bed.",
                        "Read 20 pages of the textbook.",
                        "Coffee shop session.",
                    ]},
                    "anmol": {"consistency": 0.4, "value": (45, 75), "notes": [
                        "Snoozed twice but came through.",
                    ]},
                    "priya": {"consistency": 0.65, "value": (40, 80), "notes": [
                        "Ran first then studied. Win-win.",
                        "Quiet morning, productive.",
                    ]},
                },
                "messages": [
                    ("priya", "5am club checking in 👀"),
                    ("demo", "i barely made 6am. but i made it"),
                ],
            },
        ],
    },
    {
        "name": "Social",
        "description": "The little stuff. Adulting. Keeping up.",
        "owner": "demo",
        "members": ["sam", "alex"],
        "channels": [
            {
                "name": "garbage-day",
                "description": "Take the trash out. Did you do it?",
                "kind": "binary",
                "target_unit": None,
                "target_label": None,
                "items": None,
                "profiles": {
                    "demo": {"consistency": 0.85, "notes": [
                        "Done. ✅",
                        "Out by 6am.",
                        "Recycling too.",
                    ]},
                    "sam": {"consistency": 0.95, "notes": [
                        "Done before coffee.",
                        "On it.",
                    ]},
                    "alex": {"consistency": 0.5, "notes": [
                        "Better late than never.",
                        "Got it eventually.",
                    ]},
                },
                "messages": [
                    ("sam", "fyi pickup is 7am tomorrow"),
                    ("demo", "🙏"),
                    ("alex", "thanks for the reminder lol"),
                ],
            },
            {
                "name": "gym-time",
                "description": "Lift, run, swim, whatever — 30+ minutes.",
                "kind": "numeric",
                "target_unit": "min",
                "target_label": "workout",
                "items": None,
                "profiles": {
                    "demo": {"consistency": 0.6, "value": (30, 70), "notes": [
                        "Push day.",
                        "Ran 4 miles.",
                        "Pull day. Felt strong.",
                    ]},
                    "sam": {"consistency": 0.9, "value": (45, 90), "notes": [
                        "Heavy squat day.",
                        "Long run + foam rolling.",
                        "Bench PR ❤️‍🔥",
                    ]},
                    "alex": {"consistency": 0.4, "value": (20, 50), "notes": [
                        "Walked instead. Counts.",
                        "Quick body weight circuit.",
                    ]},
                },
                "messages": [
                    ("sam", "anyone want to lift saturday?"),
                    ("demo", "i'm in. 10am?"),
                    ("alex", "i'll come watch and judge"),
                ],
            },
            {
                "name": "call-mom",
                "description": "Call your mom. Or dad. Or grandma.",
                "kind": "binary",
                "target_unit": None,
                "target_label": None,
                "items": None,
                "profiles": {
                    "demo": {"consistency": 0.45, "notes": [
                        "Long catch up.",
                        "Quick check in.",
                    ]},
                    "sam": {"consistency": 0.6, "notes": [
                        "Sunday call.",
                        "Mom told me to eat better.",
                    ]},
                    "alex": {"consistency": 0.3, "notes": [
                        "Brief but good.",
                    ]},
                },
                "messages": [
                    ("demo", "weekly reminder: call your mom"),
                    ("sam", "just did 🥲"),
                ],
            },
        ],
    },
]


# ---------------------------------------------------------------------------
# Upsert helpers

def upsert_user(db, email: str, username: str) -> User:
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        return existing
    u = User(email=email, username=username, password_hash=hash_password(DEMO_PASSWORD))
    db.add(u)
    db.flush()
    return u


def upsert_server(db, name: str, description: str, owner: User) -> Server:
    existing = (
        db.query(Server)
        .filter(Server.owner_id == owner.id, Server.name == name)
        .first()
    )
    if existing:
        existing.description = description
        return existing
    s = Server(name=name, description=description, owner_id=owner.id)
    db.add(s)
    db.flush()
    return s


def ensure_server_member(db, user_id: int, server_id: int, role: str = "member"):
    existing = (
        db.query(ServerMember)
        .filter(ServerMember.user_id == user_id, ServerMember.server_id == server_id)
        .first()
    )
    if existing:
        return existing
    db.add(ServerMember(user_id=user_id, server_id=server_id, role=role))
    db.flush()


def upsert_channel(db, server: Server, spec: dict, creator: User) -> Channel:
    existing = (
        db.query(Channel)
        .filter(Channel.server_id == server.id, Channel.name == spec["name"])
        .first()
    )
    if existing:
        existing.description = spec.get("description")
        existing.kind = spec.get("kind", "numeric")
        existing.target_unit = spec.get("target_unit")
        existing.target_label = spec.get("target_label")
        existing.items = json.dumps(spec["items"]) if spec.get("items") else None
        return existing
    ch = Channel(
        server_id=server.id,
        name=spec["name"],
        description=spec.get("description"),
        kind=spec.get("kind", "numeric"),
        target_unit=spec.get("target_unit"),
        target_label=spec.get("target_label"),
        items=json.dumps(spec["items"]) if spec.get("items") else None,
        created_by=creator.id,
    )
    db.add(ch)
    db.flush()
    return ch


def ensure_channel_member(db, user_id: int, channel_id: int):
    existing = (
        db.query(ChannelMember)
        .filter(
            ChannelMember.user_id == user_id, ChannelMember.channel_id == channel_id
        )
        .first()
    )
    if existing:
        return existing
    db.add(ChannelMember(user_id=user_id, channel_id=channel_id))
    db.flush()


# ---------------------------------------------------------------------------
# Seed body

def midnight_utc(d: datetime) -> datetime:
    return d.replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=timezone.utc)


def seed_checkins_for_member(db, channel: Channel, user: User, profile: dict, days: int = 30) -> list[int]:
    today = midnight_utc(datetime.now(timezone.utc))
    created: list[int] = []
    items_count = len(json.loads(channel.items)) if channel.items else 0

    for offset in range(days, -1, -1):
        if random.random() > profile["consistency"]:
            continue
        ts = today - timedelta(days=offset)
        ts = ts.replace(
            hour=random.choice([6, 8, 12, 17, 18, 19, 20, 21]),
            minute=random.randint(0, 59),
            second=random.randint(0, 59),
        )

        # Skip if a check-in already exists for this user/channel/day
        day_start = ts.replace(hour=0, minute=0, second=0)
        existing = (
            db.query(CheckIn)
            .filter(
                CheckIn.user_id == user.id,
                CheckIn.channel_id == channel.id,
                CheckIn.checked_in_at >= day_start,
                CheckIn.checked_in_at < day_start + timedelta(days=1),
            )
            .first()
        )
        if existing:
            created.append(existing.id)
            continue

        if channel.kind == "checklist":
            lo, hi = profile["checklist_range"]
            k = min(random.randint(lo, hi), items_count)
            checked_items = sorted(random.sample(range(items_count), k))
            value = float(len(checked_items))
            note = random.choice(profile["notes"]) if random.random() < 0.5 else None
            ci = CheckIn(
                user_id=user.id,
                channel_id=channel.id,
                value=value,
                note=note,
                checked_items=json.dumps(checked_items),
                checked_in_at=ts,
            )
        elif channel.kind == "binary":
            note = random.choice(profile["notes"]) if random.random() < 0.5 else None
            ci = CheckIn(
                user_id=user.id,
                channel_id=channel.id,
                value=1.0,
                note=note,
                checked_in_at=ts,
            )
        else:
            # numeric
            lo, hi = profile["value"]
            decimals = 0 if lo >= 10 else 1
            v = round(random.uniform(lo, hi), decimals)
            note = random.choice(profile["notes"]) if random.random() < 0.7 else None
            ci = CheckIn(
                user_id=user.id,
                channel_id=channel.id,
                value=v,
                note=note,
                checked_in_at=ts,
            )

        db.add(ci)
        db.flush()
        created.append(ci.id)
    return created


def sprinkle_reactions(db, checkin_ids: list[int], user_ids: list[int]):
    for cid in checkin_ids:
        if random.random() > 0.35:
            continue
        emojis = random.sample(REACTIONS_POOL, random.randint(1, 2))
        for emoji in emojis:
            uid = random.choice(user_ids)
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


def seed_messages(db, channel: Channel, lines, username_to_id: dict[str, int]):
    if db.query(Message).filter(Message.channel_id == channel.id).count() >= 4:
        return
    base = datetime.now(timezone.utc) - timedelta(hours=random.randint(2, 12))
    for i, (uname, content) in enumerate(lines):
        uid = username_to_id.get(uname)
        if uid is None:
            continue
        ts = base + timedelta(minutes=i * 6 + random.randint(0, 5))
        db.add(Message(
            channel_id=channel.id,
            user_id=uid,
            content=content,
            message_type="text",
            created_at=ts,
        ))
    db.flush()


def main():
    # Apply schema/migrations defensively in case the DB hasn't been booted yet
    Base.metadata.create_all(bind=engine)
    run_startup_migrations(engine)

    db = SessionLocal()
    try:
        print("→ Upserting users")
        users_by_username: dict[str, User] = {}
        for u in USERS:
            user = upsert_user(db, u["email"], u["username"])
            users_by_username[u["username"]] = user
        db.commit()
        print(f"  ✓ {len(users_by_username)} users")

        for spec in SERVERS:
            print(f"\n=== {spec['name']} ===")
            owner = users_by_username[spec["owner"]]
            server = upsert_server(db, spec["name"], spec["description"], owner)
            ensure_server_member(db, owner.id, server.id, role="owner")
            for uname in spec.get("members", []):
                if uname not in users_by_username:
                    continue
                ensure_server_member(db, users_by_username[uname].id, server.id)
            db.commit()

            for ch_spec in spec["channels"]:
                channel = upsert_channel(db, server, ch_spec, creator=owner)
                ensure_channel_member(db, owner.id, channel.id)
                for uname in spec.get("members", []):
                    if uname in users_by_username:
                        ensure_channel_member(db, users_by_username[uname].id, channel.id)
                db.commit()

                channel_user_ids: list[int] = []
                channel_checkin_ids: list[int] = []
                for uname, profile in ch_spec.get("profiles", {}).items():
                    if uname not in users_by_username:
                        continue
                    user = users_by_username[uname]
                    channel_user_ids.append(user.id)
                    ids = seed_checkins_for_member(db, channel, user, profile)
                    channel_checkin_ids.extend(ids)
                db.commit()

                sprinkle_reactions(db, channel_checkin_ids, channel_user_ids)
                db.commit()

                username_to_id = {n: u.id for n, u in users_by_username.items()}
                seed_messages(db, channel, ch_spec.get("messages", []), username_to_id)
                db.commit()

                print(f"  • #{channel.name} ({channel.kind}): {len(channel_checkin_ids)} check-ins")

        print()
        print("Done.")
        print()
        print("Demo accounts (password: demo1234):")
        for u in USERS:
            print(f"  {u['email']:<25}  {u['username']}")
        print()
        print("Open http://localhost:3000 and log in.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
