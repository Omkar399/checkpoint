# Checkpoint

Social accountability platform for shipping work. Servers + channels + daily check-ins
with streaks, reactions, and a leaderboard.

- **Backend**: FastAPI + SQLAlchemy + SQLite + WebSockets + APScheduler
- **Frontend**: Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui

## Prerequisites

- [`uv`](https://docs.astral.sh/uv/getting-started/installation/) (recommended) or Python 3.11+
- Node.js 20+
- npm

## Quick start

One command to install everything, seed demo data, and verify:

```bash
./setup.sh
```

Then run both servers together:

```bash
./start.sh
```

That starts:

- Backend at **http://localhost:8000** (uvicorn with `--reload`, logs at `.run/backend.log`)
- Frontend at **http://localhost:3000** (Next.js dev server in foreground)

Ctrl+C stops both.

## Demo accounts

After running `./setup.sh`, log in with any of these (password for all: `demo1234`):

| email | username | role |
|---|---|---|
| `demo@example.com` | demo | owner of all 3 servers |
| `anmol@example.com` | anmol | study buddy |
| `priya@example.com` | priya | study buddy |
| `sam@example.com` | sam | leaderboard winner |
| `alex@example.com` | alex | sporadic joiner |

You can also register a new account at `/register` — auth is local.

## What's seeded

`backend/scripts/seed_all.py` is idempotent. It creates:

- **Run** server — `#Daily running` (numeric km)
- **College** server — `#project-161` (numeric hrs), `#midterm-daa` (checklist of 11 DAA chapters), `#morning-study` (numeric min)
- **Social** server — `#garbage-day` (binary), `#gym-time` (numeric min), `#call-mom` (binary)

…with ~30 days of check-ins per member, varied consistency profiles, sample chat messages, and emoji reactions on recent entries.

## Manual run (without scripts)

If you'd rather run each piece yourself:

```bash
# backend
cd backend
uv venv && source .venv/bin/activate
uv pip install -r requirements.txt
python -m scripts.seed_all
uvicorn main:app --reload

# frontend (separate terminal)
cd frontend
npm install
npm run dev
```

## Tests

```bash
cd backend && source .venv/bin/activate && pytest -v
```

16 tests covering auth, channels, check-ins, leaderboard, reactions.

## Environment

`backend/.env` (auto-created from `.env.example` by `setup.sh`):

```
DATABASE_URL=sqlite:///./checkpoint.db
SECRET_KEY=dev-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

`frontend/.env.local` (auto-created from `.env.local.example`):

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000/api/v1/ws
```

## Project layout

```
backend/        FastAPI app — routers, services, schemas, models, scripts, tests
frontend/       Next.js app — App Router, typed API client, WebSocket hook
design/         Design system spec (Spotify-inspired)
deliverables/   Sprint reports
setup.sh        One-shot install + seed
start.sh        Run both backend + frontend together
```

## Features

Auth, servers, channels (4 kinds: numeric / binary / freeform / checklist),
real-time messages, daily check-ins with streak tracking, emoji reactions,
monthly leaderboard, user profile with year-long activity heatmap, dashboard
with progress ring + Coach Bot motivation (100+ attributed quotes), Coach Bot
APScheduler crons (09:00 daily summary, 18:00 inactivity nudges, welcome on
invite-join), sonner toasts + skeleton loaders.
