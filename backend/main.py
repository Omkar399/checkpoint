from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base, SessionLocal
from app.migrations import run_startup_migrations

# Import all models so they register with Base
from app.models import (  # noqa: F401
    User,
    Server,
    ServerMember,
    Invite,
    Channel,
    ChannelMember,
    Message,
    CheckIn,
    Reaction,
)

# Create all tables (no-op for existing tables) then apply ALTER migrations.
Base.metadata.create_all(bind=engine)
run_startup_migrations(engine)


def _run_daily_summary_job() -> None:
    """Cron job: generate daily summary for every server."""
    from app.services import coachbot_service
    from app.models.server import Server as ServerModel

    print("[coachbot] daily summary job: starting")
    db = SessionLocal()
    try:
        servers = db.query(ServerModel).all()
        for server in servers:
            try:
                coachbot_service.generate_daily_summary(db, server.id)
            except Exception as exc:
                print(f"[coachbot] daily summary failed for server {server.id}: {exc}")
        print(f"[coachbot] daily summary job: processed {len(servers)} server(s)")
    except Exception as exc:
        print(f"[coachbot] daily summary job: top-level failure: {exc}")
    finally:
        db.close()


def _run_inactivity_nudge_job() -> None:
    """Cron job: send inactivity nudges for every server."""
    from app.services import coachbot_service
    from app.models.server import Server as ServerModel

    print("[coachbot] inactivity nudge job: starting")
    db = SessionLocal()
    try:
        servers = db.query(ServerModel).all()
        for server in servers:
            try:
                coachbot_service.send_inactivity_nudges(db, server.id)
            except Exception as exc:
                print(f"[coachbot] inactivity nudge failed for server {server.id}: {exc}")
        print(f"[coachbot] inactivity nudge job: processed {len(servers)} server(s)")
    except Exception as exc:
        print(f"[coachbot] inactivity nudge job: top-level failure: {exc}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure Coach Bot user exists
    db = SessionLocal()
    try:
        from app.services.coachbot_service import get_or_create_bot
        get_or_create_bot(db)
    finally:
        db.close()

    # Start APScheduler with two cron jobs (UTC).
    scheduler = AsyncIOScheduler(timezone="UTC")
    scheduler.add_job(
        _run_daily_summary_job,
        CronTrigger(hour=9, minute=0),
        id="coachbot_daily_summary",
        replace_existing=True,
    )
    scheduler.add_job(
        _run_inactivity_nudge_job,
        CronTrigger(hour=18, minute=0),
        id="coachbot_inactivity_nudges",
        replace_existing=True,
    )
    scheduler.start()
    print("[coachbot] scheduler started: daily summary 09:00 UTC, nudges 18:00 UTC")

    app.state.scheduler = scheduler

    try:
        yield
    finally:
        scheduler.shutdown(wait=False)
        print("[coachbot] scheduler stopped")


app = FastAPI(title="Checkpoint API", version="2.0.0", lifespan=lifespan)

# CORS middleware - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
from app.routers import auth, servers, invites, channels, messages, ws, checkins, users, reactions, leaderboard, coachbot  # noqa: E402

app.include_router(auth.router)
app.include_router(servers.router)
app.include_router(invites.router)
app.include_router(channels.router)
app.include_router(messages.router)
app.include_router(ws.router)
app.include_router(checkins.router)
app.include_router(users.router)
app.include_router(reactions.router)
app.include_router(leaderboard.router)
app.include_router(coachbot.router)


@app.get("/")
def root():
    return {"message": "Checkpoint API"}
