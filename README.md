<div align="center">

# TESTA

### AI-Powered Autonomous Web Testing Platform

**Enter a URL → AI crawls the site → generates Playwright tests → executes them → diagnoses failures → delivers a full report**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=flat&logo=playwright&logoColor=white)
![Azure AI](https://img.shields.io/badge/Azure_AI_Foundry-0078D4?style=flat&logo=microsoftazure&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat&logo=sqlite&logoColor=white)

</div>

---

## What is TESTA?

TESTA is a zero-configuration AI test orchestrator. Point it at any website and it will:

1. **Crawl** — Playwright-powered breadth-first spider discovers every page, form, and interactive element
2. **Generate** — Azure AI Foundry (GPT-5.1) writes a complete Playwright `.spec.ts` test suite from what it found
3. **Execute** — Playwright runs the tests, captures screenshots on failure
4. **Analyze** — GPT-5.1 reads each failure and produces a concise, actionable diagnosis
5. **Report** — Dashboard shows pass rate, charts, AI suggestions, and failure screenshots

Live progress streams to the browser over **Server-Sent Events** in real time.

---

## Screenshots

| New Test Run | Live Execution | Report Dashboard |
|:---:|:---:|:---:|
| Accenture-style form — enter URL + pick test types | Stage pipeline + live log terminal | Pass rate, pie chart, AI diagnosis per failure |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router) · TypeScript · Tailwind CSS · Recharts |
| **Backend** | NestJS · TypeScript · Prisma v7 |
| **Database** | SQLite (via `@prisma/adapter-libsql`) — no server needed |
| **AI** | Azure AI Foundry · GPT-5.1 via `@azure-rest/ai-inference` |
| **Testing Engine** | Playwright — crawling + test execution |
| **Real-time** | Server-Sent Events (SSE) via NestJS `@Sse()` + RxJS |
| **Monorepo** | pnpm workspaces |
| **Launch** | Shell script (`start.sh` / `start.bat`) |

---

## Project Structure

```
testa/
├── apps/
│   ├── api/                        # NestJS backend
│   │   ├── src/
│   │   │   ├── crawler/            # Playwright breadth-first spider
│   │   │   ├── test-generator/     # Azure AI → .spec.ts generation
│   │   │   ├── test-runner/        # child_process Playwright runner
│   │   │   ├── ai-analysis/        # GPT-5.1 failure diagnosis
│   │   │   ├── executions/         # Pipeline orchestrator + SSE
│   │   │   ├── projects/           # Project CRUD
│   │   │   ├── sse/                # RxJS Subject stream manager
│   │   │   └── prisma/             # Prisma service
│   │   └── prisma/
│   │       ├── schema.prisma       # SQLite schema
│   │       └── migrations/
│   │
│   └── web/                        # Next.js 16 frontend
│       └── src/app/
│           ├── projects/new/       # URL input + test type selector
│           ├── executions/[id]/    # Live SSE progress view
│           └── executions/[id]/report/  # Final report dashboard
│
└── packages/
    └── shared/                     # Shared TypeScript types (SSE events, DTOs)
```

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 20
- **pnpm** — installed automatically by the start script if missing
- An **Azure AI Foundry** project with GPT-5.1 deployed
  → [Get started at ai.azure.com](https://ai.azure.com)

### 1. Clone

```bash
git clone https://github.com/ChaubeyAvinash/Testa-AI-Orchestrator-.git
cd Testa-AI-Orchestrator-
```

### 2. Configure Azure AI credentials

```bash
cp .env.example apps/api/.env
```

Edit `apps/api/.env`:

```env
# SQLite — no server needed
DATABASE_URL=file:./dev.db

# Azure AI Foundry — ai.azure.com → your project → Deployments
AZURE_INFERENCE_ENDPOINT=https://<your-project>.services.ai.azure.com/models
AZURE_AI_API_KEY=<your-azure-ai-key>
AZURE_AI_MODEL=gpt-5.1
```

### 3. Run

**Linux / macOS / Git Bash**

```bash
bash start.sh
```

**Windows (Command Prompt)**

```bat
start.bat
```

The script handles everything automatically:

| Step | What it does |
|---|---|
| ① Prerequisites | Checks Node.js, installs pnpm if missing |
| ② Environment | Detects missing `.env` and prompts to fill it |
| ③ Dependencies | Runs `pnpm install` if `node_modules` is absent |
| ④ Shared types | Builds `packages/shared` |
| ⑤ Migration | Applies SQLite migrations (`apps/api/dev.db`) |
| ⑥ Start | Launches API + Frontend concurrently with colour-coded logs |

Services:
- **Frontend** → http://localhost:3000
- **API** → http://localhost:3001/api/v1

---

## Usage

1. Open **http://localhost:3000**
2. Enter a **project name** and **target URL** (e.g. `https://example.com`)
3. Select **test types**:
   - Navigation Testing — all pages load without errors
   - Form Validation — fills and submits every form
   - Accessibility Audit — alt text, ARIA labels, heading hierarchy
   - Visual Regression — full-page screenshots
   - API Intercept — asserts XHR/fetch calls return 2xx
4. Click **Generate & Execute Tests `>`**
5. Watch the live pipeline: **Crawl → Generate → Execute → Analyze**
6. View the report — pass rate, AI failure diagnosis, screenshots

---

## API Reference

Base URL: `http://localhost:3001/api/v1`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Liveness check |
| `GET` | `/projects` | List all projects |
| `POST` | `/projects` | Create project `{ name, url }` |
| `GET` | `/projects/:id` | Get project + execution history |
| `POST` | `/executions` | Start execution `{ projectId, testTypes[] }` |
| `GET` | `/executions/:id` | Get execution status |
| `GET` | `/executions/:id/stream` | **SSE** — live progress events |
| `GET` | `/executions/:id/results` | All test results |
| `GET` | `/executions/:id/generated-code` | Raw generated `.spec.ts` |
| `GET` | `/projects/:id/executions` | Execution history |

---

## SSE Event Stream

The `/executions/:id/stream` endpoint sends typed events in real time:

```jsonc
{ "event": "stage_change",        "data": { "stage": "CRAWLING",   "message": "Crawling website..." } }
{ "event": "crawl_progress",      "data": { "pagesFound": 5,        "currentUrl": "https://..." } }
{ "event": "generation_complete", "data": { "linesOfCode": 142 } }
{ "event": "test_complete",       "data": { "testName": "...",      "status": "PASSED", "duration": 1240 } }
{ "event": "analysis_complete",   "data": { "failuresAnalyzed": 2 } }
{ "event": "execution_complete",  "data": { "totalTests": 18,       "passedTests": 16, "failedTests": 2 } }
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | `file:./dev.db` | SQLite file path |
| `AZURE_INFERENCE_ENDPOINT` | Yes | — | Azure AI Foundry endpoint URL |
| `AZURE_AI_API_KEY` | Yes | — | Azure AI API key |
| `AZURE_AI_MODEL` | No | `gpt-5.1` | Model deployment name |
| `PORT` | No | `3001` | API server port |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Allowed frontend origin |
| `CRAWLER_MAX_PAGES` | No | `20` | Max pages to crawl per run |
| `CRAWLER_TIMEOUT` | No | `60000` | Crawl timeout (ms) |
| `PLAYWRIGHT_TEST_TIMEOUT` | No | `30000` | Per-test timeout (ms) |
| `PLAYWRIGHT_MAX_CONCURRENCY` | No | `2` | Parallel test workers |
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:3001` | Frontend → API URL |

---

## Architecture Deep Dive

### Execution Pipeline

```
POST /executions
        │
        ▼
  CrawlerService                   Playwright chromium.launch()
  Breadth-first spider             Max CRAWLER_MAX_PAGES pages
  Discovers: pages, forms,    ────► Emits: crawl_progress (SSE)
  buttons, inputs, links
        │
        ▼
  TestGeneratorService             Azure AI Foundry GPT-5.1
  Builds structured prompt    ────► Returns: full .spec.ts file
  with page + element context      Emits: generation_complete (SSE)
        │
        ▼
  TestRunnerService                child_process spawn
  Writes spec to tmpdir       ────► npx playwright test --reporter=json
  Parses results.json              Emits: test_complete per test (SSE)
  Captures failure screenshots
        │
        ▼
  AiAnalysisService                Azure AI Foundry GPT-5.1
  Per-failure: error +        ────► 3-5 sentence plain-text diagnosis
  stack + code snippet             Max 3 concurrent calls
  Emits: analysis_complete (SSE)
        │
        ▼
  Persist to SQLite (Prisma)
  Emit: execution_complete (SSE)
```

### Database Schema

```
Project ──< Execution ──< TestResult
```

- `Project` — name + URL
- `Execution` — status, testTypes (JSON), crawlResult, generated code, counts
- `TestResult` — per-test: status, duration, error, screenshot (base64), AI suggestion

### Real-time Streaming

`SseService` holds a `Map<executionId, Subject<SSEEvent>>`. The pipeline emits events at every stage boundary and after each individual test completes. The frontend `useSSEStream` hook wraps the browser `EventSource` API and auto-redirects to the report on `execution_complete`.

---

## Scripts

| Command | Description |
|---|---|
| `bash start.sh` | Start everything (Linux/macOS/Git Bash) |
| `start.bat` | Start everything (Windows CMD) |
| `make start` | Alias for `bash start.sh` |
| `make build` | Build all packages |
| `make migrate` | Apply SQLite migrations |
| `make clean` | Remove build artifacts |

### Manual dev commands

```bash
# API in watch mode only
pnpm --filter api start:dev

# Frontend in dev mode only
pnpm --filter @testa/web dev

# Build shared types
pnpm --filter @testa/shared build
```

---

## License

MIT
