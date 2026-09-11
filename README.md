# IT Service Platform

Fullstack IT Service Management Platform featuring:
- **Backend**: Node.js, TypeScript, Express, Prisma, PostgreSQL
- **Frontend**: Next.js 16 (App Router), React 19, Material-UI (MUI)
- **Testing**: Vitest (backend unit tests), Playwright (frontend E2E tests)
- **Containerization**: Multi-stage Docker builds & Docker Compose

---

## Quick Start with Docker Compose

To build and launch the complete stack (PostgreSQL, Backend API, Frontend Web App):

```bash
docker compose up --build -d
```

### Application URLs & Exposed Ports

| Service | Container URL / Port | Host Access URL | Notes |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | `http://localhost:3000` | `http://localhost:3000` | Next.js App Router |
| **Backend API** | `http://localhost:4000` | `http://localhost:4000` | Express / Prisma API |
| **API Health Check** | `http://localhost:4000/api/health` | `http://localhost:4000/api/health` | Public health endpoint |
| **PostgreSQL Database** | `postgres:5432` (internal) | `localhost:5433` | Host port mapped to `5433` |

> **Note on Database Port:** The backend connects internally to `postgres:5432` within the Docker network. Host port `5433` is mapped for local management tools (`psql`, DBeaver) to prevent conflicts with any pre-existing local PostgreSQL service running on host port `5432`.

### Managing Docker Containers

- **View Status:** `docker compose ps`
- **View Logs (All Services):** `docker compose logs -f`
- **View Backend Logs:** `docker compose logs -f backend`
- **View Frontend Logs:** `docker compose logs -f frontend`
- **View PostgreSQL Logs:** `docker compose logs -f postgres`
- **Stop Containers (Preserve Data Volume):** `docker compose down`

---

## Local Development & Test Workflows

Backend unit tests and Frontend Playwright E2E tests use dedicated test runners:

### 1. Backend Tests (Vitest)
```bash
# From backend directory
cd backend
npm test          # Runs Vitest unit tests
npm run lint      # Runs ESLint check
npm run build     # Compiles TypeScript (tsc)
```

### 2. Frontend E2E Tests (Playwright)
```bash
# From frontend directory
cd frontend
npm run lint      # Runs ESLint check
npm run build     # Compiles Next.js production build
npx playwright test   # Runs Playwright E2E test suite (requires backend on :4000)
```

### 3. Root Workspace Commands
```bash
npm run test:backend   # Runs backend Vitest suite
npm run test:frontend  # Runs frontend Playwright E2E suite
npm run test:e2e       # Runs frontend Playwright E2E suite
npm run lint           # Runs linting across both services
npm run build          # Builds both backend and frontend
```

---

## Continuous Integration (CI) Pipeline

The automated GitHub Actions CI workflow in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) executes:
1. `backend` job: PostgreSQL service container + `npm test` + `npm run build`
2. `frontend` job: `npm run lint` + `npm run build`
3. `e2e` job: Runs Playwright integration suite (`auth.spec.ts`, `tickets.spec.ts`, `rbac.spec.ts`)
