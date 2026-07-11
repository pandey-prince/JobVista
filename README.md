# JobVista

A job portal for **job seekers** — IT roles in India from company career pages (100+ sources). Only India-relevant roles are shown.

> **Applicant-only mode:** The product UI is for job seekers. Recruiter signup and admin dashboards are hidden; the public job feed shows scraped career-page listings only. Recruiter APIs remain in the backend for ops but are not exposed in the app.

## Live

| Service | URL |
|---------|-----|
| Frontend | https://job-vista-eta.vercel.app |
| Backend API | https://jobvista-ahek.onrender.com |

## Tech stack

- **Frontend:** React (Vite), Redux, Tailwind, shadcn/ui
- **Backend:** Node.js 20, Express 5, MongoDB (Mongoose)
- **Deploy:** Vercel (frontend), Render (backend), MongoDB Atlas

## Features

- Job seeker auth (JWT cookies) — student accounts only
- Job feed: scraped company career pages (India IT roles only)
- **JobMate AI Assistant:** Gemini-powered career assistant (optional `GEMINI_API_KEY`)
- 100+ Indian company career sources (Greenhouse, Lever, Workday, TCS, etc.)
- Job seeker tools: save jobs, email alerts, watchlist instant alerts, application kanban, resume match score
- First-letter profile avatars (no photo upload required)
- Docker Compose for local full stack

## Product UX (Phases 1–7)

### Routes

| Path | Description |
|------|-------------|
| `/jobs` | Main job feed with filters, sort, and mobile filter drawer (`/browse` redirects here) |
| `/companies/:slug` | Company page — careers-page meta, sync status, and paginated openings for one company |
| `/profile/setup` | Multi-step profile wizard after signup |
| `/description/:id` | Job detail with apply-on-company-site CTA and JobMate context |

### Job filters & sort

On `/jobs`, filters sync to the URL and API query params:

- **Company** — multi-select from monitored career sources (`companies` CSV on `GET /job/get`)
- **Sort** — `newest` (default) or `company` (A–Z)
- **Location, work mode, experience, role, job type, posted within** — same as before

On viewports below `lg`, filters open in a drawer; on desktop they stay in the sidebar.

### Onboarding checklist

Logged-in students see a three-step checklist on **Home** (dismissible banner) and **Profile**:

1. Complete profile (`/profile/setup`)
2. Watch 3 companies (`/my-companies`)
3. Create 1 email alert (`/alerts`)

Progress is computed from existing profile, watchlist, and alerts data — no extra DB fields.

### Recommended jobs

- **Home — Jobs for you:** `GET /job/recommended` when logged in with skills or preferred roles
- **Guests / empty profile:** CTA to complete profile instead of an empty grid
- Match score uses simple keyword overlap against job title and description

### Trust signals on job cards

Job cards show **freshness badges** (Posted today, New, Career page) and a **source label** (e.g. “From Razorpay”) via `JobFreshnessBadges`.

## Project structure

```
JobVista/
├── backend/                 # Express API
├── frontend-codes/frontend/ # React app (Vercel root)
├── docker-compose.yml
└── render.yaml              # Render backend blueprint
```

## Architecture (modular layout)

### Backend

Controllers stay thin and delegate to **services**:

| Module | Role |
|--------|------|
| `services/job-catalog/` | Job mapping, scraped lists, external feeds (Remotive/Arbeitnow) |
| `services/trackedApplication.service.js` | Kanban tracker sync and migration |
| `services/gemini.service.js` | Shared Gemini client for match score |
| `services/email.service.js` | Resend email delivery |
| `services/alertDigest.service.js` | Daily digest matching + send |
| `services/watchlistAlert.service.js` | Instant watchlist alerts after scrape |

Routes map to controllers; controllers call services — not the other way around.

### Frontend

| Layer | Role |
|-------|------|
| `src/api/client.js` | Shared axios instance (credentials, base URL) |
| `src/api/index.js` | Domain APIs: `authApi`, `jobsApi`, `savedJobsApi`, `alertsApi`, `trackerApi`, `careerSourceApi`, … |
| `src/app/router.jsx` | Route definitions |
| `src/layouts/MainLayout.jsx` | Navbar + `<Outlet />` shell |
| `src/features/*/` | Feature hooks and UI (`useJobAlerts`, `useTrackedApplications`, `MatchScorePanel`) |
| `src/components/` | Page-level and shared UI |

New job-seeker screens should use the API layer and feature hooks instead of calling axios directly.

## Local development

### 1. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/jobvista
SECRET_KEY=your-local-secret
FRONTEND_URL=http://localhost:5173
SCRAPE_ENABLED=true
SCRAPE_ON_BOOT=false
LINK_CHECK_ENABLED=true
LINK_CHECK_CRON=0 3 * * *
LINK_CHECK_FAIL_THRESHOLD=3
```

Scraped jobs are kept fresh by:
- **Scrape sync** (default every 6 hours) — re-reads career boards and hard-deletes jobs no longer listed
- **Link check** (default daily) — validates `applicationUrl` and hard-deletes confirmed 404 / "job not found" pages after 3 failures

Recruiters can trigger manually via API (ops): `POST /api/v1/scraped-jobs/link-check`

Optional company logo uploads (otherwise files save to `backend/uploads/`):

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
API_BASE_URL=http://localhost:8000
```

Optional — seed demo data (legacy recruiter jobs; not shown in applicant-only feed):

```bash
npm run seed
```

Creates a demo recruiter, companies, and ~15 IT jobs in the database. Idempotent (only replaces its own demo data). These internal jobs do not appear in the public feed in applicant-only mode.

```bash
npm run dev
```

### 2. Frontend

```bash
cd frontend-codes/frontend
npm install
npm run dev
```

API URLs default to `http://localhost:8000/api/v1` in dev. Override with `VITE_*` vars — see `vercel.env.example`.

### 3. Docker

```bash
docker compose up --build
```

Frontend: http://localhost:3000 · Backend: http://localhost:8000

## API routes (`/api/v1`)

| Prefix | Purpose |
|--------|---------|
| `/user` | Register, login, logout, profile, **session (`GET /me`)** |
| `/job` | List jobs (scraped feed), **sort** (`sortBy`), **company filter** (`companies`), **`GET /recommended`** |
| `/application` | Apply to internal jobs (legacy; feed is scraped-only) |
| `/company` | Recruiter companies (API only) |
| `/scraped-jobs` | Scraped jobs + admin sources (admin API only) |
| `/career-sources` | Public directory, watchlist, Excel import, **`GET /:slug/jobs`** company page API |
| `/chatbot` | JobMate messages |
| `/stats` | Public platform stats (job counts, companies monitored) |
| `/saved-jobs` | Bookmark jobs (student) |
| `/alerts` | Email job alerts — daily digest 8 PM IST (student) |
| `/tracked-applications` | Application kanban tracker (student) |

## Email alerts (Resend)

Set on backend (Render dashboard or `backend/.env`):

```env
RESEND_API_KEY=re_xxxx
EMAIL_FROM=JobVista <notifications@yourdomain.com>
ALERT_DIGEST_CRON=30 14 * * *
```

`ALERT_DIGEST_CRON` runs at **8:00 PM IST** (14:30 UTC). Without `RESEND_API_KEY`, emails are skipped in dev.

## Scraping (hybrid: Render + GitHub Actions)

| Layer | What runs | Where |
|-------|-------------|--------|
| **API scrapers** (~47) | greenhouse, lever, workday, smartrecruiters, RSS, etc. | **Render** cron every 6h (`SCRAPE_ENABLED=true`, puppeteer skipped) |
| **Puppeteer scrapers** (~55) | `auto-puppeteer` career pages | **GitHub Actions** daily — [`.github/workflows/scrape-puppeteer.yml`](.github/workflows/scrape-puppeteer.yml) |

Render sets `SKIP_PUPPETEER_SCRAPERS=true` — Puppeteer companies are **not** scraped on the hosted backend.

### GitHub Actions setup (required for full 100-source coverage)

1. Repo **Settings → Secrets and variables → Actions**
2. Add secret: `MONGO_URI` (same Atlas URI as Render)
3. Workflow runs **daily** (08:00 IST) and supports **manual dispatch** from the Actions tab

The workflow runs:
1. `reprobe:sources` — tries to upgrade auto-puppeteer boards to API scrapers
2. `sync:puppeteer` — scrapes remaining Puppeteer sources into Atlas
3. `source-health` — logs a status report

### Ops sync endpoint (optional)

`POST /api/v1/scraped-jobs/sync/ops?mode=api|puppeteer|all` with header `x-cron-secret: <CRON_SECRET>`.

Set `CRON_SECRET` on Render if you want external cron triggers. Render’s built-in scheduler already syncs **API sources only**.

### Manual scripts (debug only)

Do **not** run Puppeteer sync against production Atlas from your laptop. Production Puppeteer scraping is handled only by the GitHub Actions workflow above.

```bash
cd backend
npm run sync:api              # API sources only (Render-style)
npm run sync:puppeteer        # Local debugging only — CI uses the same script
npm run reprobe:sources       # Upgrade auto-puppeteer → API where possible
npm run sync:health           # Report; add --report-only to never fail exit code
```

### One-time: kick API sync on Render

After deploy, either wait for the 6h cron or temporarily set `SCRAPE_ON_BOOT=true` in Render and redeploy once.

## Tests

```bash
cd backend
npm test                                    # API suite (server running)
npm run test:integration                    # MongoDB + scrapers (slow)
TEST_API_BASE=http://localhost:8000 node scripts/e2e-test.js
```

## Deployment

- **Render:** Connect repo, root `backend`, set `MONGO_URI`, `SECRET_KEY`, `FRONTEND_URL`
- **Vercel:** Root `frontend-codes/frontend`, env vars from `vercel.env.example`

## License

MIT
