@echo off
setlocal EnableDelayedExpansion

echo.
echo   ^>  TESTA -- AI Test Orchestrator
echo   ----------------------------------------
echo.

:: ── 1. Check prerequisites ────────────────────────────────────────────────────
echo [TESTA] Checking prerequisites...

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo   x  Node.js not found. Download from https://nodejs.org ^(v20+^)
    pause & exit /b 1
)
for /f "tokens=*" %%i in ('node -e "process.stdout.write(process.version)"') do set NODE_VER=%%i
echo   OK  Node.js %NODE_VER%

where pnpm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [TESTA] pnpm not found -- installing pnpm@latest...
    call npm install -g pnpm@latest
)

:: Lockfile uses format v9.0 -- requires pnpm v9+
for /f "tokens=*" %%i in ('pnpm --version') do set PNPM_VER=%%i
for /f "tokens=1 delims=." %%i in ("%PNPM_VER%") do set PNPM_MAJOR=%%i
if %PNPM_MAJOR% LSS 9 (
    echo [TESTA] pnpm %PNPM_VER% is too old ^(need v9+^) -- upgrading...
    call npm install -g pnpm@latest
    for /f "tokens=*" %%i in ('pnpm --version') do set PNPM_VER=%%i
)
echo   OK  pnpm %PNPM_VER%

:: ── 2. Check .env ─────────────────────────────────────────────────────────────
echo [TESTA] Checking environment...

if not exist "apps\api\.env" (
    echo [TESTA] No apps\api\.env found -- copying from .env.example...
    copy ".env.example" "apps\api\.env" >nul
    echo.
    echo   WARNING: Edit apps\api\.env and set your Azure AI Foundry credentials:
    echo     AZURE_INFERENCE_ENDPOINT = https://^<project^>.services.ai.azure.com/models
    echo     AZURE_AI_API_KEY         = ^<your-key^>
    echo.
    pause
)
echo   OK  .env file present

:: ── 3. Install dependencies ───────────────────────────────────────────────────
if not exist "node_modules" (
    echo [TESTA] Installing dependencies...
    call pnpm install
) else (
    echo   OK  Dependencies already installed
)

:: ── 4. Build shared package ───────────────────────────────────────────────────
echo [TESTA] Building shared types...
call pnpm --filter @testa/shared build --silent
echo   OK  Shared package built

:: ── 5. Run database migration ─────────────────────────────────────────────────
echo [TESTA] Running database migration ^(SQLite^)...
cd apps\api
set DATABASE_URL=file:./dev.db
call npx prisma migrate deploy --schema=./prisma/schema.prisma
echo   OK  Database ready at apps\api\dev.db
cd ..\..

:: ── 6. Start both services ────────────────────────────────────────────────────
echo.
echo   Starting services...
echo     API      -- http://localhost:3001/api/v1
echo     Frontend -- http://localhost:3000
echo.

call pnpm exec concurrently ^
  --names "API,WEB" ^
  --prefix-colors "magenta,cyan" ^
  --kill-others ^
  --kill-others-on-fail ^
  "cd apps/api && pnpm run start:dev" ^
  "cd apps/web && pnpm run dev"
