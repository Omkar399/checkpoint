"""Convert midterm-daa channel to a checklist of DAA chapters and re-seed
30 days of check-ins where each member ticks a varied subset of chapters.

Also cleans up binary channels (garbage-day, call-mom, daily-workout) by
nulling their stray numeric values — those values were artifacts of the
original numeric-only seed.

Usage (from backend/ with venv activated):
    python -m scripts.reseed_checklist
"""

from __future__ import annotations

import json
import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.database import SessionLocal  # noqa: E402
from app.models.channel import Channel  # noqa: E402
from app.models.checkin import CheckIn  # noqa: E402
from app.models.user import User  # noqa: E402
from app.models.channel_member import ChannelMember  # noqa: E402

random.seed(99)


CHAPTERS = [
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


# Per-user consistency profile for the checklist channel.
# Higher consistency = more chapters checked per session and more sessions.
PROFILES = {
    "demo": {"session_prob": 0.8, "min_items": 1, "max_items": 4, "notes": [
        "DP problems. Got 3 of 5.",
        "Re-read graph algorithms.",
        "Mock exam under timer. 78%.",
        "Office hours — clarified amortized analysis.",
        "NP-complete reductions. Painful but learning.",
        "Quick review session.",
    ]},
    "anmol": {"session_prob": 0.85, "min_items": 2, "max_items": 5, "notes": [
        "Wrote out master theorem proofs.",
        "Practice problems in the library.",
        "Mock exam — feeling OK about it.",
        "Long session, finally got the DP intuition.",
    ]},
    "priya": {"session_prob": 0.7, "min_items": 1, "max_items": 3, "notes": [
        "Reviewed dynamic programming.",
        "Couldn't crack problem 3 on the practice.",
        "Late night cram session.",
        "Going slow. Quality > quantity.",
    ]},
}


def midnight_utc(d: datetime) -> datetime:
    return d.replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=timezone.utc)


def main():
    db = SessionLocal()
    try:
        # Find midterm-daa
        channel = db.query(Channel).filter(Channel.name == "midterm-daa").first()
        if channel is None:
            print("✗ midterm-daa channel not found.")
            return

        # Convert kind + items
        channel.kind = "checklist"
        channel.items = json.dumps(CHAPTERS)
        # Clear numeric metadata (no longer applicable)
        channel.target_unit = None
        channel.target_label = None
        db.commit()
        print(f"✓ midterm-daa kind=checklist with {len(CHAPTERS)} chapters")

        # Wipe existing check-ins on this channel (numeric-style, incompatible)
        deleted = db.query(CheckIn).filter(CheckIn.channel_id == channel.id).delete()
        db.commit()
        print(f"✓ wiped {deleted} stale numeric check-ins")

        # Find members
        members = (
            db.query(ChannelMember)
            .filter(ChannelMember.channel_id == channel.id)
            .all()
        )
        # Map user_id -> username for profile lookup
        users_in_channel: list[User] = []
        for cm in members:
            u = db.query(User).filter(User.id == cm.user_id).first()
            if u and u.username in PROFILES:
                users_in_channel.append(u)

        # Backfill 30 days
        today = midnight_utc(datetime.now(timezone.utc))
        total = 0
        for offset in range(30, -1, -1):
            for user in users_in_channel:
                profile = PROFILES[user.username]
                if random.random() > profile["session_prob"]:
                    continue
                slot = random.choice([8, 12, 17, 19, 21])
                ts = today - timedelta(days=offset)
                ts = ts.replace(
                    hour=slot,
                    minute=random.randint(0, 59),
                    second=random.randint(0, 59),
                )
                # Pick a random subset of chapters
                k = random.randint(profile["min_items"], profile["max_items"])
                k = min(k, len(CHAPTERS))
                checked = sorted(random.sample(range(len(CHAPTERS)), k))
                note = (
                    random.choice(profile["notes"])
                    if random.random() < 0.5
                    else None
                )
                ci = CheckIn(
                    user_id=user.id,
                    channel_id=channel.id,
                    value=float(len(checked)),  # store count for streak/leaderboard
                    note=note,
                    checked_items=json.dumps(checked),
                    checked_in_at=ts,
                )
                db.add(ci)
                total += 1
        db.commit()
        print(f"✓ inserted {total} checklist check-ins across {len(users_in_channel)} members")

        # Clean up stale numeric values on binary channels
        binary_channels = (
            db.query(Channel).filter(Channel.kind == "binary").all()
        )
        for ch in binary_channels:
            updated = (
                db.query(CheckIn)
                .filter(CheckIn.channel_id == ch.id)
                .update({"value": 1.0})
            )
            print(f"  · {ch.name}: normalized {updated} check-ins to value=1")
        db.commit()

        print()
        print("Done. Reload http://localhost:3000 and open #midterm-daa.")

    finally:
        db.close()


if __name__ == "__main__":
    main()
