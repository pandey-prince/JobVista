# JobLeLo

A job portal for **job seekers** — IT roles in India from company career pages (100+ sources). Only India-relevant roles are shown.

> **Applicant-only mode:** The product UI is for job seekers. Recruiter signup is blocked; the public job feed shows scraped career-page listings only. Platform ops use a separate **admin** login at `/admin/login` (not linked in the student navbar).

## Live

| Service | URL |
|---------|-----|
| Frontend | https://www.joblelo.online |
| Backend API | https://jobvista-ahek.onrender.com |

## Tech stack

- **Frontend:** React (Vite), Redux, Tailwind, shadcn/ui
- **Backend:** Node.js 20, Express 5, MongoDB (Mongoose)
- **Deploy:** Vercel (frontend), Render (backend), MongoDB Atlas

## Custom domain (joblelo.online)

1. **Vercel** → Project **job-vista** → Settings → Domains → add `www.joblelo.online` and `joblelo.online` (redirect apex → www).
2. At your domain registrar, point DNS to Vercel (A/CNAME records shown in Vercel dashboard).
3. **Render** → **jobvista-backend** → Environment → set `FRONTEND_URL=https://www.joblelo.online` and redeploy (needed for CORS + email links).
4. Optional: set `VITE_SITE_URL=https://www.joblelo.online` in Vercel env vars.

The old Vercel URL (`job-vista-eta.vercel.app`) still works during transition; backend CORS allows both.

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
| `src/api/index.js` | Domain APIs: `authApi`, `jobsApi`, `adminApi`, `savedJobsApi`, `alertsApi`, `trackerApi`, `careerSourceApi`, … |
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

### Admin ops dashboard

Admin accounts are **not** created via public signup. Bootstrap once with env vars in `backend/.env` (see `.env.example`):

```env
ADMIN_EMAIL=ops@example.com
ADMIN_PASSWORD=your-strong-password
ADMIN_FULLNAME=JobLeLo Admin
ADMIN_PHONE=9000000000
```

```bash
cd backend
npm run seed:admin
```

Then open **http://localhost:5173/admin/login** (production: `https://www.joblelo.online/admin/login`).

| Path | Purpose |
|------|---------|
| `/admin` | Ops dashboard — platform stats + searchable company table (scraped vs in-DB vs visible on site) |
| `/admin/sources` | Manage career sources — sync, enable/disable, add URL, Excel import |

All `/api/v1/admin/*` and scraped-jobs source mutations require the `admin` role and JWT cookie. Student accounts cannot access admin routes.

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
| `/scraped-jobs` | Scraped jobs + source ops (admin role only) |
| `/admin` | Admin dashboard stats and source list (`GET /dashboard`, `GET /sources`) |
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
EMAIL_FROM=JobLeLo <notifications@joblelo.online>
ALERT_DIGEST_CRON=30 14 * * *
```

`ALERT_DIGEST_CRON` runs at **8:00 PM IST** (14:30 UTC). Without `RESEND_API_KEY`, emails are skipped in dev.

## Scraping (hybrid: GitHub Actions + Render)

| Layer | What runs | Where |
|-------|-------------|--------|
| **API scrapers** (~47) | greenhouse, lever, workday, smartrecruiters, RSS, etc. | **GitHub Actions** every 6h — [`.github/workflows/scrape-api.yml`](.github/workflows/scrape-api.yml) (primary) |
| **Puppeteer scrapers** (~55) | `auto-puppeteer` career pages | **GitHub Actions** daily — [`.github/workflows/scrape-puppeteer.yml`](.github/workflows/scrape-puppeteer.yml) (3 parallel shards) |

Render sets `SKIP_PUPPETEER_SCRAPERS=true` — Puppeteer companies are **not** scraped on the hosted backend. Render’s built-in cron is an **optional backup** for API sync when the web process stays awake; **GitHub Actions is the primary** reliable runner for API sources.

### GitHub Actions setup (required for full 100-source coverage)

1. Repo **Settings → Secrets and variables → Actions**
2. Add secret: `MONGO_URI` (same Atlas URI as Render)
3. Workflows support **manual dispatch** from the Actions tab

**API sync** ([`scrape-api.yml`](.github/workflows/scrape-api.yml)) runs every 6 hours:
1. **api-sync** — `node scripts/sync-api.js` for greenhouse, lever, workday, smartrecruiters, RSS, etc.
2. **source health** — `node scripts/source-health.js --report-only` after sync

**Puppeteer sync** ([`scrape-puppeteer.yml`](.github/workflows/scrape-puppeteer.yml)) runs daily (08:00 IST):
1. **priority-puppeteer** — user-submitted `auto-puppeteer` sources queued via `priorityPuppeteerSync`
2. **reprobe** — tries to upgrade auto-puppeteer boards to API scrapers (once per run)
3. **puppeteer-sync** — 3 parallel matrix jobs (`PUPPETEER_SHARD` 0–2), ~18 sources each, 3h timeout per shard
4. **health-report** — logs a status report after all shards finish

**Priority Puppeteer sync** ([`scrape-puppeteer-priority.yml`](.github/workflows/scrape-puppeteer-priority.yml)) runs on demand when a user submits a generic career page:
- Triggered via `repository_dispatch` when Render has `GITHUB_WORKFLOW_DISPATCH_TOKEN` + `GITHUB_REPO` set
- Also supports manual dispatch from the Actions tab (~30 min timeout)
- Without the token, sources stay queued until the next priority or daily Puppeteer run

### Ops sync endpoint (optional)

`POST /api/v1/scraped-jobs/sync/ops?mode=api|puppeteer|all` with header `x-cron-secret: <CRON_SECRET>`.

Set `CRON_SECRET` on Render if you want external cron triggers. Render’s built-in scheduler already syncs **API sources only**.

### Manual scripts (debug only)

Do **not** run Puppeteer sync against production Atlas from your laptop. Production Puppeteer scraping is handled only by the GitHub Actions workflow above.

```bash
cd backend
npm run sync:api              # API sources only (Render-style)
npm run sync:puppeteer        # Local debugging only — CI uses the same script
npm run sync:puppeteer-priority  # User-queued Puppeteer sources only
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
