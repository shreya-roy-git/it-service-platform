# IT Service Platform — Frontend

A Next.js (App Router) frontend for the IT Service Platform, with Material UI and JWT-based authentication.

---

## Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| Backend | Running at `http://localhost:4000` |

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and set your backend URL:

```bash
cp .env.example .env.local
# Edit .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server on port 3000 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test:e2e` | Run E2E tests (requires running dev servers) |
| `npm run test:e2e:run` | Run E2E tests + auto-start dev server |
| `npm run test:e2e:headed` | Run E2E tests in headed (visible) browser |
| `npm run test:e2e:ui` | Open Playwright interactive UI |
| `npm run test:e2e:report` | Open last HTML test report |

---

## E2E Testing (Playwright)

End-to-end tests live in [`e2e/`](./e2e/).

### Setup

Playwright and Chromium are already installed. On a fresh clone, run:

```bash
npm install
npx playwright install chromium
```

### Running tests

> **Requires**: Both frontend (`localhost:3000`) and backend (`localhost:4000`) must be running.

```bash
# Terminal 1 — Backend
cd ../backend && npm run dev

# Terminal 2 — Frontend
npm run dev

# Terminal 3 — Run tests
npm run test:e2e
```

To auto-start the frontend dev server from Playwright (backend must still be running manually):

```bash
npm run test:e2e:run
```

### Test credentials (seeded in DB)

| Role | Email | Password |
|------|-------|----------|
| Administrator | `manager@example.test` | `Manager@123` |
| Service Desk Analyst | `analyst@example.test` | `Analyst@123` |

### Test suite — Part 1: Authentication

File: [`e2e/auth.spec.ts`](./e2e/auth.spec.ts)

| Test ID | Description |
|---------|-------------|
| TC-AUTH-001 | Login form renders correctly |
| TC-AUTH-002 | Admin login → redirects to dashboard, stores JWT |
| TC-AUTH-003 | Analyst login → redirects to dashboard, stores JWT |
| TC-AUTH-004 | Wrong password → shows error, stays on /login |
| TC-AUTH-005 | Non-existent email → shows error |
| TC-AUTH-006 | Submit button disabled when fields empty |
| TC-AUTH-007 | Logout → clears token, redirects to /login |
| TC-AUTH-008 | Unauthenticated → /dashboard redirects to /login |
| TC-AUTH-009 | Unauthenticated → /tickets redirects to /login |
| TC-AUTH-010 | Unauthenticated → /users redirects to /login |
| TC-AUTH-011 | Analyst → /users denied (RBAC) |
| TC-AUTH-012 | Admin → /users accessible |

### View HTML report

```bash
npm run test:e2e:report
```

---

## Project Structure

```
frontend/
├── app/                  # Next.js App Router pages
│   ├── login/            # Login page
│   ├── tickets/          # Ticket management
│   ├── reports/          # Reports
│   └── users/            # User management (Admin only)
├── components/           # Shared UI components
│   ├── auth/             # ProtectedRoute
│   └── layout/           # AppLayout, Sidebar
├── context/              # AuthContext (JWT state)
├── e2e/                  # Playwright E2E tests
│   ├── auth.spec.ts      # Authentication tests
│   └── helpers.ts        # Test constants & utilities
├── lib/api/              # API client (Axios + JWT interceptor)
├── types/                # TypeScript interfaces
└── playwright.config.ts  # Playwright configuration
```
