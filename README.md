# TESTA — AI-Powered Autonomous Web Testing Platform

Enter a URL. TESTA crawls the site, generates Playwright tests with Claude AI, executes them, and delivers a full report with AI failure analysis.

## Quick Start

### 1. Prerequisites

- Docker + Docker Compose
- An [Anthropic API key](https://console.anthropic.com)

### 2. Configure

```bash
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Run

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- API: http://localhost:3001/api/v1/health

### 4. Use

1. Open http://localhost:3000
2. Enter a project name and website URL
3. Select test types (navigation, forms, accessibility, etc.)
4. Click **Generate & Execute Tests**
5. Watch live progress — stages: Crawl → Generate → Execute → Analyze
6. View the full report with pass/fail breakdown, AI suggestions, and screenshots

---

## Local Development (without Docker)

```bash
# Install dependencies
npm install -g pnpm
pnpm install

# Start PostgreSQL (Docker just for DB)
docker compose up db -d

# Copy and edit env
cp .env.example apps/api/.env
# Set DATABASE_URL and ANTHROPIC_API_KEY

# Run migrations
cd apps/api && DATABASE_URL=postgresql://testa:testa_secret@localhost:5432/testa_db npx prisma migrate dev

# Start both apps
pnpm dev
```

---

## Architecture

```
apps/
  web/    Next.js 14 (App Router) + Tailwind + Recharts
  api/    NestJS + Prisma + PostgreSQL

packages/
  shared/ Shared TypeScript types (SSE events, DTOs)
```

### Pipeline

```
User submits URL
  → CrawlerService     (Playwright spider, breadth-first)
  → TestGeneratorService (Claude API generates .spec.ts)
  → TestRunnerService  (child_process: npx playwright test --reporter=json)
  → AiAnalysisService  (Claude diagnoses each failure)
  → Report Dashboard
```

Live progress is streamed via **Server-Sent Events** (SSE).

---

## Environment Variables

See `.env.example` for the full list. Required:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | Claude API key |
