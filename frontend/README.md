# Checkpoint — Frontend (Next.js)

Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui. Talks to the FastAPI backend
at `../backend/` via REST (`/api/v1`) and WebSocket (`/api/v1/ws/{channel_id}`).

The original React/Vite implementation has been removed. Recoverable from git
history at commit `4fb7a9e^` if needed for reference.

## Setup

```bash
npm install
cp .env.local.example .env.local   # if not already present
npm run dev
```

Open http://localhost:3000.

## Environment

`.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000/api/v1/ws
```

The backend has CORS set to `*`, so the Next dev server can hit
`http://localhost:8000` directly — no proxy needed.

## Scripts

- `npm run dev` — dev server on port 3000
- `npm run build` — production build
- `npm start` — serve the production build
- `npm run lint` — ESLint

## Layout

```
src/
├── app/                    # App Router pages
│   ├── (app)/              # authed routes (dashboard, channels)
│   ├── login/              # public
│   ├── register/
│   └── join/[inviteCode]/
├── components/ui/          # shadcn primitives
├── hooks/use-websocket.ts  # WS + polling fallback
├── lib/api/                # typed REST client
└── providers/              # AuthProvider
```

## Auth

Tokens live in `localStorage` under the key `token`. The axios client attaches
a `Bearer` header on every request; 401s force a redirect to `/login`.

## Backend

See `../backend/README.md` (or run `uvicorn main:app --reload` from
`../backend/`). The WebSocket closes with code 4001 on bad tokens and 4003 on
non-member channels.
