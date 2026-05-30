#!/usr/bin/env bash
set -e

# ── Colours ────────────────────────────────────────────────────────────────────
PURPLE='\033[0;35m'
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

print_banner() {
  echo ""
  echo -e "${PURPLE}${BOLD}  >  TESTA — AI Test Orchestrator${RESET}"
  echo -e "${PURPLE}  ──────────────────────────────────────${RESET}"
  echo ""
}

step() { echo -e "${CYAN}${BOLD}[TESTA]${RESET} $1"; }
ok()   { echo -e "${GREEN}  ✓  $1${RESET}"; }
fail() { echo -e "${RED}  ✗  $1${RESET}"; exit 1; }

print_banner

# ── 1. Check prerequisites ─────────────────────────────────────────────────────
step "Checking prerequisites..."

command -v node >/dev/null 2>&1 || fail "Node.js not found. Install from https://nodejs.org (v20+)"
NODE_VER=$(node -e "process.stdout.write(process.version)")
ok "Node.js $NODE_VER"

if ! command -v pnpm >/dev/null 2>&1; then
  step "pnpm not found — installing pnpm@latest..."
  npm install -g pnpm@latest
fi

# Lockfile uses format v9.0 — requires pnpm v9+
PNPM_VER=$(pnpm --version)
PNPM_MAJOR=$(echo "$PNPM_VER" | cut -d. -f1)
if [ "$PNPM_MAJOR" -lt 9 ]; then
  step "pnpm $PNPM_VER is too old (need v9+) — upgrading..."
  npm install -g pnpm@latest
  PNPM_VER=$(pnpm --version)
fi
ok "pnpm $PNPM_VER"

# ── 2. Check .env ──────────────────────────────────────────────────────────────
step "Checking environment..."

ENV_FILE="apps/api/.env"
if [ ! -f "$ENV_FILE" ]; then
  step "No $ENV_FILE found — creating from .env.example..."
  cp .env.example "$ENV_FILE"
  echo ""
  echo -e "${RED}${BOLD}  ⚠  ACTION REQUIRED${RESET}"
  echo -e "  Edit ${BOLD}apps/api/.env${RESET} and set your Azure AI Foundry credentials:"
  echo -e "    ${CYAN}AZURE_INFERENCE_ENDPOINT${RESET}  = https://<project>.services.ai.azure.com/models"
  echo -e "    ${CYAN}AZURE_AI_API_KEY${RESET}          = <your-key>"
  echo ""
  read -p "  Press Enter when you have saved your keys, or Ctrl+C to abort..." _
fi
ok ".env file present"

# ── 3. Install dependencies ────────────────────────────────────────────────────
if [ ! -d "node_modules" ]; then
  step "Installing dependencies..."
  pnpm install
else
  ok "Dependencies already installed"
fi

# ── 4. Build shared package ────────────────────────────────────────────────────
step "Building shared types..."
pnpm --filter @testa/shared build --silent
ok "Shared package built"

# ── 5. Run database migration ──────────────────────────────────────────────────
step "Running database migrations (SQLite)..."
cd apps/api
DATABASE_URL="file:./dev.db" npx prisma migrate deploy --schema=./prisma/schema.prisma 2>&1 | grep -E "migrat|sync|error" || true
ok "Database ready at apps/api/dev.db"
cd ../..

# ── 6. Start both services ─────────────────────────────────────────────────────
echo ""
echo -e "${PURPLE}${BOLD}  Starting services...${RESET}"
echo -e "  ${CYAN}API${RESET}      → http://localhost:3001/api/v1"
echo -e "  ${CYAN}Frontend${RESET} → http://localhost:3000"
echo ""

# Run API and frontend concurrently using pnpm's concurrently (already a root devDep)
pnpm exec concurrently \
  --names "API,WEB" \
  --prefix-colors "magenta,cyan" \
  --kill-others \
  --kill-others-on-fail \
  "cd apps/api && pnpm run start:dev" \
  "cd apps/web && pnpm run dev"
