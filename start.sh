#!/usr/bin/env bash
# Checkpoint — start both services.
# Backend runs in the background; frontend in the foreground. Ctrl+C kills both.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT/backend"
FRONTEND_DIR="$ROOT/frontend"
LOG_DIR="$ROOT/.run"
mkdir -p "$LOG_DIR"
BACKEND_LOG="$LOG_DIR/backend.log"

GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RED="\033[0;31m"
NC="\033[0m"

if [[ ! -d "$BACKEND_DIR/.venv" ]]; then
  printf "${RED}✗${NC} backend/.venv not found. Run ${YELLOW}./setup.sh${NC} first.\n" >&2
  exit 1
fi
if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  printf "${RED}✗${NC} frontend/node_modules not found. Run ${YELLOW}./setup.sh${NC} first.\n" >&2
  exit 1
fi

# Pre-flight: refuse to start if the ports are taken
for port in 8000 3000; do
  if lsof -nP -iTCP:$port -sTCP:LISTEN >/dev/null 2>&1; then
    printf "${RED}✗${NC} port $port is already in use. Stop the other process and retry.\n" >&2
    exit 1
  fi
done

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    printf "\n${BLUE}→${NC} stopping backend (pid $BACKEND_PID)\n"
    kill "$BACKEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

# ---------- backend ----------
printf "${BLUE}→${NC} starting backend  (uvicorn :8000) → log: ${BACKEND_LOG}\n"
(
  cd "$BACKEND_DIR"
  # shellcheck disable=SC1091
  source .venv/bin/activate
  exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload >"$BACKEND_LOG" 2>&1
) &
BACKEND_PID=$!

# Wait until the backend responds (or fails)
for i in {1..30}; do
  if curl -sf -m 2 -o /dev/null http://localhost:8000/; then
    printf "${GREEN}✓${NC} backend is up\n"
    break
  fi
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    printf "${RED}✗${NC} backend failed to start. Last lines of $BACKEND_LOG:\n" >&2
    tail -20 "$BACKEND_LOG" >&2
    exit 1
  fi
  sleep 0.5
done

# ---------- frontend ----------
printf "${BLUE}→${NC} starting frontend (next dev :3000) — Ctrl+C to stop both\n\n"
cd "$FRONTEND_DIR"
exec npm run dev
