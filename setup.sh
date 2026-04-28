#!/usr/bin/env bash
# Checkpoint — one-shot setup
#
# - Backend: creates a uv-managed venv, installs deps, runs migrations, seeds demo data.
# - Frontend: installs npm deps and copies .env.local from the example if missing.
#
# After this script completes, run `./start.sh` to launch backend + frontend together.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT/backend"
FRONTEND_DIR="$ROOT/frontend"

GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RED="\033[0;31m"
NC="\033[0m"
log()   { printf "${BLUE}→${NC} %s\n" "$*"; }
ok()    { printf "${GREEN}✓${NC} %s\n" "$*"; }
warn()  { printf "${YELLOW}⚠${NC} %s\n" "$*"; }
fail()  { printf "${RED}✗${NC} %s\n" "$*" >&2; exit 1; }

# ---------- prerequisites ----------

command -v node >/dev/null 2>&1 || fail "node is required (install Node 20+)"
command -v npm  >/dev/null 2>&1 || fail "npm is required"

if command -v uv >/dev/null 2>&1; then
  PY_INSTALLER="uv"
  ok "uv detected: $(uv --version 2>&1 | head -1)"
else
  if ! command -v python3 >/dev/null 2>&1; then
    fail "uv or python3 is required (recommend installing uv: https://docs.astral.sh/uv/getting-started/installation/)"
  fi
  PY_INSTALLER="pip"
  warn "uv not found — falling back to python3 + pip (slower). Install uv for a better experience."
fi

# ---------- backend ----------

log "Setting up backend (Python)"
cd "$BACKEND_DIR"

if [[ ! -f .env ]]; then
  if [[ -f .env.example ]]; then
    cp .env.example .env
    ok "Copied backend/.env.example → backend/.env"
  fi
fi

if [[ "$PY_INSTALLER" == "uv" ]]; then
  uv venv --python 3.11 --quiet
  # shellcheck disable=SC1091
  source .venv/bin/activate
  uv pip install --quiet -r requirements.txt
else
  python3 -m venv .venv
  # shellcheck disable=SC1091
  source .venv/bin/activate
  pip install --quiet --upgrade pip
  pip install --quiet -r requirements.txt
fi
ok "Backend dependencies installed"

log "Seeding demo data"
python -m scripts.seed_all
ok "Seed complete"

deactivate || true
cd "$ROOT"

# ---------- frontend ----------

log "Setting up frontend (Next.js)"
cd "$FRONTEND_DIR"

if [[ ! -f .env.local ]]; then
  if [[ -f .env.local.example ]]; then
    cp .env.local.example .env.local
    ok "Copied frontend/.env.local.example → frontend/.env.local"
  fi
fi

# Reuse cached npm deps when possible
if [[ -d node_modules && -f node_modules/.package-lock.json ]] && cmp -s package-lock.json node_modules/.package-lock.json; then
  ok "Frontend dependencies already up to date"
else
  npm install --silent
  ok "Frontend dependencies installed"
fi

cd "$ROOT"

printf "\n${GREEN}✓ Setup complete${NC}\n\n"
printf "Demo login: ${BLUE}demo@example.com${NC} / ${BLUE}demo1234${NC}\n"
printf "Other demo accounts (same password): anmol, priya, sam, alex (all @example.com)\n\n"
printf "Run ${YELLOW}./start.sh${NC} to launch backend (:8000) and frontend (:3000) together.\n"
