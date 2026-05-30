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

command -v npm >/dev/null 2>&1 || fail "npm not found. It ships with Node.js — reinstall Node.js from https://nodejs.org"
NPM_VER=$(npm --version)
ok "npm $NPM_VER"

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
  npm install
else
  ok "Dependencies already installed"
fi

# ── 4. Build shared package ────────────────────────────────────────────────────
step "Building shared types..."
npm run build --workspace=packages/shared
ok "Shared package built"

# ── 5. Generate Prisma client + run migrations ─────────────────────────────────
step "Generating Prisma client..."
cd apps/api
DATABASE_URL="file:./dev.db" npx prisma generate --schema=./prisma/schema.prisma 2>&1 | grep -v "^$" | tail -3
ok "Prisma client ready"

step "Running database migrations (SQLite)..."
DATABASE_URL="file:./dev.db" npx prisma migrate deploy --schema=./prisma/schema.prisma 2>&1 | grep -E "migrat|sync|error" || true
ok "Database ready at apps/api/dev.db"
cd ../..

# ── 6. Start both services ─────────────────────────────────────────────────────
echo ""
echo -e "${PURPLE}${BOLD}  Starting services...${RESET}"
echo -e "  ${CYAN}API${RESET}      → http://localhost:3001/api/v1"
echo -e "  ${CYAN}Frontend${RESET} → http://localhost:3000"
echo ""

npx concurrently \
  --names "API,WEB" \
  --prefix-colors "magenta,cyan" \
  --kill-others \
  --kill-others-on-fail \
  "cd apps/api && npm run start:dev" \
  "cd apps/web && npm run dev"
