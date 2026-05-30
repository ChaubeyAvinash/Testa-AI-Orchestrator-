<div align="center">

<br/>

```
  >  TESTA
```

# AI-Powered Autonomous Web Testing Platform

**No test scripts. No configuration. Just a URL.**

TESTA crawls your website, writes Playwright tests using GPT-5.1, executes them, and delivers an AI-diagnosed failure report — all in one click.

<br/>

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)
[![Azure AI](https://img.shields.io/badge/Azure_AI_Foundry-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white)](https://ai.azure.com/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)

<br/>

</div>

---

## What is TESTA?

TESTA is an AI-powered autonomous testing agent. You give it a URL — it does everything else.

```
  You                        TESTA
  ───                        ─────
  Enter URL        ──►  Crawl every page & element
  Select test types ──►  GPT-5.1 writes .spec.ts tests
  Click Run         ──►  Playwright executes the suite
                    ──►  GPT-5.1 diagnoses each failure
                    ──►  Dashboard report with screenshots
```

Live execution progress streams to the browser over **Server-Sent Events** in real time — no polling, no refresh.

---

## Key Features

| Feature | Description |
|---|---|
| 🕷️ **AI Crawler** | Playwright breadth-first spider — discovers pages, forms, buttons, inputs |
| 🤖 **Test Generation** | GPT-5.1 writes a complete `.spec.ts` file tailored to what it found |
| ▶️ **Playwright Runner** | Executes generated tests in Chromium, captures screenshots on failure |
| 🔍 **AI Failure Analysis** | GPT-5.1 reads error + stack trace + code and gives a 3–5 sentence fix |
| 📡 **Live SSE Stream** | Every stage transition and test result streams to the UI in real time |
| 📊 **Report Dashboard** | Pass rate, Recharts pie chart, result table, AI suggestions, screenshot lightbox |
| 🗄️ **Zero Infrastructure** | SQLite — no database server, no Docker, no Redis. One local file. |
| 🎨 **Accenture UI** | Black/purple enterprise design system — sharp, professional, no rounded corners |

---

## Test Types

Choose one or more when starting a run:

| Type | What it tests |
|---|---|
| **Navigation** | Every discovered page loads, returns no error, has a non-empty title |
| **Form Validation** | Fills and submits every form with realistic data, asserts success/error states |
| **Accessibility** | Alt text on images, ARIA labels on buttons, proper heading hierarchy |
| **Visual Regression** | Full-page screenshots of key pages for comparison |
| **API Intercept** | Intercepts XHR/fetch calls and asserts they return 2xx status codes |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router) · TypeScript · Tailwind CSS · Recharts |
| **Backend** | NestJS 11 · TypeScript · Prisma v7 |
| **Database** | SQLite via `@prisma/adapter-libsql` — no server required |
| **AI Model** | Azure AI Foundry · GPT-5.1 via `@azure-rest/ai-inference` |
| **Browser Engine** | Playwright — used for both crawling and test execution |
| **Real-time** | Server-Sent Events · NestJS `@Sse()` · RxJS Subjects |
| **Monorepo** | pnpm workspaces (`apps/api`, `apps/web`, `packages/shared`) |
| **Launch** | `start.sh` (Linux/macOS/Git Bash) · `start.bat` (Windows) |

---

## Project Structure

```
Testa-AI-Orchestrator/
│
├── start.sh                        ← One-command launcher (Linux/macOS/Git Bash)
├── start.bat                       ← One-command launcher (Windows CMD)
├── .env.example                    ← Environment variable template
│
├── apps/
│   │
│   ├── api/                        ← NestJS backend (port 3001)
│   │   ├── src/
│   │   │   ├── crawler/            ← Playwright spider
│   │   │   ├── test-generator/     ← GPT-5.1 prompt + .spec.ts output
│   │   │   ├── test-runner/        ← child_process + JSON reporter
│   │   │   ├── ai-analysis/        ← Per-failure GPT-5.1 diagnosis
│   │   │   ├── executions/         ← Pipeline orchestrator + SSE emitter
│   │   │   ├── projects/           ← Project CRUD
│   │   │   ├── sse/                ← RxJS Subject stream manager
│   │   │   └── prisma/             ← Prisma service (SQLite)
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── migrations/
│   │
│   └── web/                        ← Next.js 16 frontend (port 3000)
│       └── src/
│           ├── app/
│           │   ├── projects/new/           ← URL + test type form
│           │   ├── executions/[id]/        ← Live SSE progress view
│           │   └── executions/[id]/report/ ← Final report dashboard
│           ├── hooks/
│           │   └── useSSEStream.ts         ← EventSource wrapper
│           └── lib/
│               └── api-client.ts           ← Typed fetch wrapper
│
└── packages/
    └── shared/                     ← Shared TypeScript types
        └── src/types/
            ├── enums.ts            ← ExecutionStatus, TestStatus, TestType
            ├── execution.ts        ← ExecutionDto, TestResultDto
            ├── project.ts          ← ProjectDto
            └── sse-events.ts       ← All SSE event shapes
```

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 20 — [nodejs.org](https://nodejs.org)
- **Azure AI Foundry** account with **GPT-5.1** deployed — [ai.azure.com](https://ai.azure.com)
- pnpm is installed automatically if missing

### 1. Clone the repository

```bash
git clone https://github.com/ChaubeyAvinash/Testa-AI-Orchestrator-.git
cd Testa-AI-Orchestrator-
```

### 2. Add your Azure AI credentials

```bash
cp .env.example apps/api/.env
```

Open `apps/api/.env` and fill in:

```env
# Database — SQLite file, no server needed
DATABASE_URL=file:./dev.db

# Azure AI Foundry
# → ai.azure.com  →  your project  →  Deployments
AZURE_INFERENCE_ENDPOINT=https://<your-project>.services.ai.azure.com/models
AZURE_AI_API_KEY=<your-api-key>
AZURE_AI_MODEL=gpt-5.1
```

### 3. Launch

**Linux / macOS / Git Bash**
```bash
bash start.sh
```

**Windows (Command Prompt)**
```bat
start.bat
```

The script is fully automatic — no manual steps:

```
  ① Check Node.js is installed
  ② Install pnpm if missing
  ③ Detect missing .env → copy from template + prompt to fill in
  ④ pnpm install  (skipped if node_modules already exists)
  ⑤ Build packages/shared (TypeScript types)
  ⑥ prisma migrate deploy  (creates apps/api/dev.db)
  ⑦ Start API + Frontend concurrently with colour-coded logs
```

### 4. Open the app

| Service | URL |
|---|---|
| **Frontend** | http://localhost:3000 |
| **API** | http://localhost:3001/api/v1 |
| **Health check** | http://localhost:3001/api/v1/health |

---

## How to Use

1. Go to **http://localhost:3000** — you land on the **New Test Run** form
2. Enter a **Project Name** and **Target URL**
3. Select **test coverage types** (navigation, forms, accessibility, etc.)
4. Click **Generate & Execute Tests `>`**
5. Watch the live pipeline on the **Execution** screen:
   ```
   CRAWL  ──►  GENERATE  ──►  EXECUTE  ──►  ANALYZE
   ```
6. Auto-redirected to the **Report Dashboard** when complete
7. Expand any failed test to see:
   - Error message and stack trace
   - **AI Diagnosis** — plain-English explanation + fix suggestion
   - **Failure screenshot** (click to enlarge)

---

## API Reference

**Base URL:** `http://localhost:3001/api/v1`

| Method | Endpoint | Body / Notes |
|---|---|---|
| `GET` | `/health` | `{ status, db }` |
| `GET` | `/projects` | List all projects |
| `POST` | `/projects` | `{ name, url }` |
| `GET` | `/projects/:id` | Project + last 10 executions |
| `DELETE` | `/projects/:id` | Remove project + cascade |
| `POST` | `/executions` | `{ projectId, testTypes[] }` |
| `GET` | `/executions/:id` | Execution status + counts |
| `GET` | `/executions/:id/stream` | **SSE** — live events until complete |
| `GET` | `/executions/:id/results` | All `TestResult` rows |
| `GET` | `/executions/:id/generated-code` | Raw `.spec.ts` text |
| `GET` | `/projects/:id/executions` | Execution history for a project |

### SSE Event Types

`GET /executions/:id/stream` streams newline-delimited JSON:

```jsonc
{ "event": "stage_change",        "data": { "stage": "CRAWLING",  "message": "Crawling website..." }}
{ "event": "crawl_progress",      "data": { "pagesFound": 7,       "currentUrl": "https://..." }}
{ "event": "generation_complete", "data": { "linesOfCode": 183 }}
{ "event": "test_started",        "data": { "testName": "Login page loads" }}
{ "event": "test_complete",       "data": { "testName": "...", "status": "FAILED", "duration": 3200, "errorMessage": "..." }}
{ "event": "analysis_complete",   "data": { "failuresAnalyzed": 3 }}
{ "event": "execution_complete",  "data": { "totalTests": 20, "passedTests": 17, "failedTests": 3 }}
{ "event": "error",               "data": { "message": "..." }}
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | `file:./dev.db` | SQLite file path |
| `AZURE_INFERENCE_ENDPOINT` | ✅ | — | Azure AI Foundry endpoint |
| `AZURE_AI_API_KEY` | ✅ | — | Azure AI API key |
| `AZURE_AI_MODEL` | | `gpt-5.1` | Deployed model name |
| `PORT` | | `3001` | API server port |
| `CORS_ORIGIN` | | `http://localhost:3000` | Allowed frontend origin |
| `CRAWLER_MAX_PAGES` | | `20` | Max pages crawled per run |
| `CRAWLER_TIMEOUT` | | `60000` | Total crawl timeout (ms) |
| `PLAYWRIGHT_TEST_TIMEOUT` | | `30000` | Per-test timeout (ms) |
| `PLAYWRIGHT_MAX_CONCURRENCY` | | `2` | Playwright parallel workers |
| `NEXT_PUBLIC_API_URL` | | `http://localhost:3001` | API URL used by the browser |

---

## Architecture

### Execution Pipeline

```
  User clicks "Generate & Execute"
          │
          ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  CrawlerService                                             │
  │  Playwright chromium.launch() · breadth-first BFS          │
  │  Discovers pages, forms, buttons, inputs, links            │
  │  Emits: crawl_progress events via SSE                      │
  └───────────────────────────┬─────────────────────────────────┘
                              │  CrawlResult { pages[] }
                              ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  TestGeneratorService                                       │
  │  Builds structured prompt from CrawlResult + testTypes     │
  │  Calls Azure AI Foundry GPT-5.1                            │
  │  Returns: complete .spec.ts file                           │
  │  Emits: generation_complete via SSE                        │
  └───────────────────────────┬─────────────────────────────────┘
                              │  generatedCode: string
                              ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  TestRunnerService                                          │
  │  Writes spec + config to os.tmpdir()                       │
  │  Spawns: npx playwright test --reporter=json               │
  │  Parses results.json → TestRunResult[]                     │
  │  Captures base64 screenshots for failures                  │
  │  Emits: test_complete per test via SSE                     │
  └───────────────────────────┬─────────────────────────────────┘
                              │  TestRunResult[]
                              ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  AiAnalysisService                                          │
  │  For each FAILED test: sends error + stack + code to GPT   │
  │  Max 3 concurrent calls                                    │
  │  Returns: Map<testName, aiSuggestion>                      │
  │  Emits: analysis_complete via SSE                          │
  └───────────────────────────┬─────────────────────────────────┘
                              │
                              ▼
  Persist TestResult rows to SQLite (Prisma)
  Emit: execution_complete  →  frontend redirects to /report
```

### Data Model

```
Project
  id, name, url, createdAt
  └── Execution[]
        id, status, testTypes, generatedCode, crawlResult
        passedTests, failedTests, totalTests, startedAt, completedAt
        └── TestResult[]
              id, testName, status, duration
              errorMessage, stackTrace
              screenshotBase64, aiSuggestion
```

### Real-time Architecture

```
  ExecutionsService.runPipeline()
          │ sseService.emit(executionId, event)
          ▼
  SseService  ←  Map<executionId, Subject<SSEEvent>>
          │ Observable<SSEEvent>
          ▼
  ExecutionsController  @Sse(':id/stream')
          │ text/event-stream
          ▼
  Browser  →  useSSEStream hook  →  React state updates
```

---

## Scripts Reference

| Command | Platform | Description |
|---|---|---|
| `bash start.sh` | Linux / macOS / Git Bash | Full auto-start |
| `start.bat` | Windows CMD | Full auto-start |
| `make start` | Any (with make) | Alias for `bash start.sh` |
| `make build` | Any | Build all packages |
| `make migrate` | Any | Apply SQLite migrations |
| `make clean` | Any | Remove `dist/`, `.next/` |

**Individual dev commands:**

```bash
# API only (hot reload)
pnpm --filter api start:dev

# Frontend only
pnpm --filter @testa/web dev

# Rebuild shared types
pnpm --filter @testa/shared build

# Prisma migration (create new)
cd apps/api && DATABASE_URL=file:./dev.db npx prisma migrate dev --name <name>

# Open Prisma Studio (DB browser)
cd apps/api && DATABASE_URL=file:./dev.db npx prisma studio
```

---

## Roadmap

- [ ] BullMQ job queue for concurrent multi-user execution
- [ ] Self-healing — auto-repair broken selectors using AI
- [ ] Natural language test commands (`"Test the checkout flow"`)
- [ ] CI/CD integration (GitHub Actions, Jenkins)
- [ ] Multi-browser execution (Firefox, WebKit)
- [ ] Scheduled test runs with email/Slack notifications
- [ ] Test history comparison and trend charts

---

## License

MIT © [Avinash Chaubey](https://github.com/ChaubeyAvinash)
