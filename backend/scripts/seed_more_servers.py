"""Add College and Social servers (each with multiple channels) for the demo
account and reuse the existing peer users so the dashboard feels lived-in.

Usage (from backend/ with venv activated):
    python -m scripts.seed_more_servers
"""

from __future__ import annotations

import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

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

random.seed(42)

# Server / channel definitions. Each channel:
#   name, description, target_unit, target_label, peers (usernames), profiles per peer.
# Profile: (consistency 0..1, value_range, notes)
def value(lo, hi, decimals=1):
    return round(random.uniform(lo, hi), decimals)


SERVERS = [
    {
        "name": "College",
        "description": "Senior year accountability. Show up for the work.",
        "peer_usernames": ["anmol", "priya"],
        "channels": [
            {
                "name": "project-161",
                "description": "CS161 group project — hours of focused work.",
                "target_unit": "hrs",
                "target_label": "deep work",
                "profiles": {
                    "demo": {"consistency": 0.7, "value": (1.0, 4.5), "notes": [
                        "Pair-programmed the auth module.",
                        "Wrote the design doc draft.",
                        "Squashed the WS race condition. Finally.",
                        "Refactored the seed script.",
                        "Pushed the migration. Tests green.",
                        "Office hours then 2 hrs of impl.",
                    ]},
                    "anmol": {"consistency": 0.6, "value": (0.5, 3.5), "notes": [
                        "Sketched the schema.",
                        "Tackled the API plumbing.",
                        "Got distracted but still shipped.",
                        "Code review + a bit of writing.",
                    ]},
                    "priya": {"consistency": 0.55, "value": (1.0, 3.0), "notes": [
                        "Frontend polish session.",
                        "Wrote tests for the checkin service.",
                        "Slow start, picked up after dinner.",
                    ]},
                },
                "messages": [
                    ("demo", "ok crew where are we on the auth flow?"),
                    ("anmol", "almost there. need 30 more min and it's done"),
                    ("priya", "i'll start the frontend polish once auth lands"),
                    ("demo", "🔥"),
                    ("anmol", "auth merged. unit tests passing"),
                    ("priya", "lfg. starting frontend now"),
                ],
            },
            {
                "name": "midterm-daa",
                "description": "Algorithms midterm prep. Hours studied.",
                "target_unit": "hrs",
                "target_label": "study",
                "profiles": {
                    "demo": {"consistency": 0.8, "value": (1.5, 4.0), "notes": [
                        "DP problems. Got 3 of 5.",
                        "Re-read graph algorithms.",
                        "Mock exam under timer. 78%.",
                        "Office hours — clarified amortized analysis.",
                        "Practice set #4 done.",
                        "NP-complete reductions. Painful but learning.",
                    ]},
                    "anmol": {"consistency": 0.85, "value": (2.0, 5.0), "notes": [
                        "Wrote out master theorem proofs.",
                        "Practice problems in the library.",
                        "Mock exam — feeling OK about it.",
                        "Group study with priya and demo.",
                    ]},
                    "priya": {"consistency": 0.7, "value": (1.0, 3.5), "notes": [
                        "Reviewed dynamic programming.",
                        "Couldn't crack problem 3 on the practice.",
                        "Late night cram session.",
                    ]},
                },
                "messages": [
                    ("priya", "anyone struggling with the DP problem from last lecture?"),
                    ("anmol", "yeah took me forever. happy to walk through it"),
                    ("demo", "library at 7?"),
                    ("priya", "i'll be there"),
                    ("anmol", "👍"),
                ],
            },
            {
                "name": "morning-study",
                "description": "Up early, lock in. 60 min before class.",
                "target_unit": "min",
                "target_label": "focus",
                "profiles": {
                    "demo": {"consistency": 0.55, "value": (30, 90), "notes": [
                        "Made it out of bed.",
                        "Read 20 pages of the textbook.",
                        "Coffee shop session.",
                        "Slow start but got it.",
                    ]},
                    "anmol": {"consistency": 0.4, "value": (45, 75), "notes": [
                        "Snoozed twice but came through.",
                        "Treadmill desk + reading.",
                    ]},
                    "priya": {"consistency": 0.65, "value": (40, 80), "notes": [
                        "Ran first then studied. Win-win.",
                        "Quiet morning, productive.",
                        "Read before checking phone. Big win.",
                    ]},
                },
                "messages": [
                    ("priya", "5am club checking in 👀"),
                    ("demo", "i barely made 6am. but i made it"),
                    ("anmol", "starting tomorrow. for real this time"),
                ],
            },
        ],
    },
    {
        "name": "Social",
        "description": "The little stuff. Adulting. Keeping up.",
        "peer_usernames": ["sam", "alex"],
        "channels": [
            {
                "name": "garbage-day",
                "description": "Take the trash out. Did you do it?",
                "target_unit": None,
                "target_label": None,
                "profiles": {
                    "demo": {"consistency": 0.85, "value": None, "notes": [
                        "Done. ✅",
                        "Out by 6am.",
                        "Recycling too.",
                        "Forgot. Moving on.",
                    ]},
                    "sam": {"consistency": 0.95, "value": None, "notes": [
                        "Done before coffee.",
                        "On it.",
                        "Took the neighbor's too. Hero behavior.",
                    ]},
                    "alex": {"consistency": 0.5, "value": None, "notes": [
                        "Better late than never.",
                        "Got it eventually.",
                        "Did it.",
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
                "target_unit": "min",
                "target_label": "workout",
                "profiles": {
                    "demo": {"consistency": 0.6, "value": (30, 70), "notes": [
                        "Push day.",
                        "Ran 4 miles.",
                        "Pull day. Felt strong.",
                        "Swim then sauna.",
                        "Easy ride home from work.",
                    ]},
                    "sam": {"consistency": 0.9, "value": (45, 90), "notes": [
                        "Heavy squat day.",
                        "Long run + foam rolling.",
                        "Yoga + core.",
                        "Bench PR ❤️‍🔥",
                    ]},
                    "alex": {"consistency": 0.4, "value": (20, 50), "notes": [
                        "Walked instead. Counts.",
                        "Got there. Did the thing.",
                        "Quick body weight circuit.",
                    ]},
                },
                "messages": [
                    ("sam", "anyone want to lift saturday?"),
                    ("demo", "i'm in. 10am?"),
                    ("alex", "i'll come watch and judge"),
                    ("sam", "😂"),
                ],
            },
            {
                "name": "call-mom",
                "description": "Call your mom. Or dad. Or grandma. Once a week minimum.",
                "target_unit": "min",
                "target_label": "call",
                "profiles": {
                    "demo": {"consistency": 0.45, "value": (15, 45), "notes": [
                        "Long catch up.",
                        "Quick check in.",
                        "Talked about her trip plans.",
                    ]},
                    "sam": {"consistency": 0.6, "value": (20, 60), "notes": [
                        "Sunday call.",
                        "Mom told me to eat better.",
                        "Sister joined the call.",
                    ]},
                    "alex": {"consistency": 0.3, "value": (10, 30), "notes": [
                        "Brief but good.",
                        "Caught up. Felt nice.",
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

REACTIONS_POOL = ["🔥", "💪", "🎉", "👏", "🚀", "✅"]


def upsert_server(db, name: str, description: str, owner: User) -> Server:
    existing = (
        db.query(Server)
        .filter(Server.owner_id == owner.id, Server.name == name)
        .first()
    )
    if existing:
        return existing
    s = Server(name=name, description=description, owner_id=owner.id)
    db.add(s)
    db.flush()
    db.add(ServerMember(user_id=owner.id, server_id=s.id, role="owner"))
    db.flush()
    return s


def upsert_channel(db, server: Server, name: str, description: str | None,
                    target_unit: str | None, target_label: str | None,
                    creator: User) -> Channel:
    existing = (
        db.query(Channel)
        .filter(Channel.server_id == server.id, Channel.name == name)
        .first()
    )
    if existing:
        return existing
    c = Channel(
        server_id=server.id,
        name=name,
        description=description,
        target_unit=target_unit,
        target_label=target_label,
        created_by=creator.id,
    )
    db.add(c)
    db.flush()
    return c


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
        .filter(
            ChannelMember.user_id == user_id, ChannelMember.channel_id == channel_id
        )
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


def seed_checkins(db, channel: Channel, user: User, profile: dict, days: int = 30) -> list[int]:
    today = midnight_utc(datetime.now(timezone.utc))
    created: list[int] = []
    for offset in range(days, -1, -1):
        if random.random() > profile["consistency"]:
            continue
        slot = random.choice([6, 8, 12, 17, 18, 19, 20, 21])
        ts = today - timedelta(days=offset)
        ts = ts.replace(hour=slot, minute=random.randint(0, 59), second=random.randint(0, 59))
        # Avoid duplicates per (user, channel, day)
        existing = (
            db.query(CheckIn)
            .filter(
                CheckIn.user_id == user.id,
                CheckIn.channel_id == channel.id,
                CheckIn.checked_in_at >= ts.replace(hour=0, minute=0, second=0),
                CheckIn.checked_in_at
                < (ts.replace(hour=0, minute=0, second=0) + timedelta(days=1)),
            )
            .first()
        )
        if existing:
            created.append(existing.id)
            continue

        v = profile["value"]
        if v is None:
            value_field = None
        else:
            lo, hi = v
            decimals = 0 if lo >= 10 else 1
            value_field = round(random.uniform(lo, hi), decimals)

        note = random.choice(profile["notes"]) if profile["notes"] and random.random() < 0.7 else None

        ci = CheckIn(
            user_id=user.id,
            channel_id=channel.id,
            value=value_field,
            note=note,
            checked_in_at=ts,
        )
        db.add(ci)
        db.flush()
        created.append(ci.id)
    return created


def sprinkle_reactions(db, checkin_ids, user_ids):
    for cid in checkin_ids:
        if random.random() > 0.35:
            continue
        emoji_count = random.randint(1, 2)
        for emoji in random.sample(REACTIONS_POOL, emoji_count):
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


def seed_messages(db, channel: Channel, lines, username_to_id):
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
    db = SessionLocal()
    try:
        demo = db.query(User).filter(User.email == "demo@example.com").first()
        if demo is None:
            print("✗ demo@example.com not found — run scripts/seed_demo.py first.")
            return

        print(f"→ Seeding for demo (id={demo.id})")

        for spec in SERVERS:
            print(f"\n=== {spec['name']} ===")
            server = upsert_server(db, spec["name"], spec["description"], demo)
            ensure_server_member(db, demo.id, server.id, role="owner")

            # Resolve peer users
            peers: list[User] = []
            for pu in spec["peer_usernames"]:
                u = db.query(User).filter(User.username == pu).first()
                if u is None:
                    print(f"  ! peer '{pu}' not found, skipping")
                    continue
                peers.append(u)
                ensure_server_member(db, u.id, server.id, role="member")
            db.commit()
            print(f"  ✓ {len(peers)} peers added to {server.name}")

            username_to_id = {demo.username: demo.id}
            for u in peers:
                username_to_id[u.username] = u.id

            for ch_spec in spec["channels"]:
                channel = upsert_channel(
                    db,
                    server=server,
                    name=ch_spec["name"],
                    description=ch_spec["description"],
                    target_unit=ch_spec["target_unit"],
                    target_label=ch_spec["target_label"],
                    creator=demo,
                )
                # Membership
                ensure_channel_member(db, demo.id, channel.id)
                for u in peers:
                    ensure_channel_member(db, u.id, channel.id)

                # Check-ins per user
                channel_user_ids: list[int] = []
                channel_checkin_ids: list[int] = []
                for uname, profile in ch_spec["profiles"].items():
                    user = demo if uname == "demo" else next((p for p in peers if p.username == uname), None)
                    if user is None:
                        continue
                    channel_user_ids.append(user.id)
                    ids = seed_checkins(db, channel, user, profile)
                    channel_checkin_ids.extend(ids)
                db.commit()

                sprinkle_reactions(db, channel_checkin_ids, channel_user_ids)
                db.commit()

                seed_messages(db, channel, ch_spec.get("messages", []), username_to_id)
                db.commit()

                print(f"  • #{channel.name}: {len(channel_checkin_ids)} check-ins")

        print()
        print("Done. Demo's dashboard will now show 3 servers.")

    finally:
        db.close()


if __name__ == "__main__":
    main()
