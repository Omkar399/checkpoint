from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base

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
)

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Checkpoint API", version="1.0.0")

# CORS middleware - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
from app.routers import auth, servers, invites, channels, messages, ws, checkins, users  # noqa: E402

app.include_router(auth.router)
app.include_router(servers.router)
app.include_router(invites.router)
app.include_router(channels.router)
app.include_router(messages.router)
app.include_router(ws.router)
app.include_router(checkins.router)
app.include_router(users.router)


@app.get("/")
def root():
    return {"message": "Checkpoint API"}
