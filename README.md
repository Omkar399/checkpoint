# Checkpoint

Social accountability platform for shipping work. Servers + channels + daily check-ins
with streaks, reactions, and a leaderboard.

- **Backend**: FastAPI + SQLAlchemy + SQLite + WebSockets
- **Frontend**: Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui

## Prerequisites

- Python 3.11+
- Node.js 20+
- npm

## Run it

Open two terminals.

### 1. Backend (port 8000)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The SQLite database (`backend/checkpoint.db`) is created automatically on first run.

### 2. Frontend (port 3000)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

## Demo account

```
email:    demo@example.com
password: demo1234
```

Or register a new account at `/register` — auth is local and the database is empty
on first start.

## Environment

Backend reads `backend/.env`:

```
DATABASE_URL=sqlite:///./checkpoint.db
SECRET_KEY=dev-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

Frontend reads `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000/api/v1/ws
```

## Project layout

```
backend/        FastAPI app — routers, services, schemas, models
frontend/       Next.js app — App Router, typed API client, WS hook
design/         Design system spec (Spotify-inspired)
deliverables/   Sprint reports
```

See `frontend/README.md` for frontend-specific notes.

## What works

Auth, servers, channels, invites, real-time messages, daily check-ins
with streak tracking, emoji reactions, monthly leaderboard, user profile
with activity heatmap, and Coach Bot daily summaries (background task,
runs every 12 hours).
