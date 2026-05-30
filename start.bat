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

where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo   x  npm not found. It ships with Node.js -- reinstall from https://nodejs.org
    pause & exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VER=%%i
echo   OK  npm %NPM_VER%

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
    call npm install
) else (
    echo   OK  Dependencies already installed
)

:: ── 4. Build shared package ───────────────────────────────────────────────────
echo [TESTA] Building shared types...
call npm run build --workspace=packages/shared
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

call npx concurrently ^
  --names "API,WEB" ^
  --prefix-colors "magenta,cyan" ^
  --kill-others ^
  --kill-others-on-fail ^
  "cd apps/api && npm run start:dev" ^
  "cd apps/web && npm run dev"
