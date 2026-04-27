import asyncio
from contextlib import asynccontextmanager

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


async def _coachbot_background_loop():
    """Run Coach Bot tasks periodically (daily summary + nudges)."""
    from app.services import coachbot_service
    from app.models.server import Server as ServerModel

    while True:
        await asyncio.sleep(3600 * 12)  # Run every 12 hours
        db = SessionLocal()
        try:
            servers = db.query(ServerModel).all()
            for server in servers:
                coachbot_service.generate_daily_summary(db, server.id)
                coachbot_service.send_inactivity_nudges(db, server.id)
        except Exception:
            pass
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

    # Start background loop
    task = asyncio.create_task(_coachbot_background_loop())
    yield
    task.cancel()


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
