# JobVista

A job portal for IT roles in India — internal recruiter postings, scraped company career pages (100 sources), and live Remotive/Arbeitnow feeds.

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

- Student & recruiter auth (JWT cookies)
- Merged job feed: internal + scraped + Remotive + Arbeitnow
- **JobMate AI Assistant:** Gemini-powered career assistant (optional `GEMINI_API_KEY`)
- 100 Indian company career sources (Greenhouse, Lever, Workday, TCS, etc.)
- Watchlist / wishlist / submit career URLs
- Recruiter dashboard: companies, jobs, applicants, scrape admin
- First-letter profile avatars (no photo upload required)
- Docker Compose for local full stack

## Project structure

```
JobVista/
├── backend/                 # Express API
├── frontend-codes/frontend/ # React app (Vercel root)
├── docker-compose.yml
└── render.yaml              # Render backend blueprint
```

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
```

Optional company logo uploads (otherwise files save to `backend/uploads/`):

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
API_BASE_URL=http://localhost:8000
```

Optional — seed demo jobs so the board is never empty:

```bash
npm run seed
```

Creates a demo recruiter, companies, and ~15 IT jobs. Idempotent (only replaces its own demo data).

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
| `/job` | List/create jobs |
| `/application` | Apply, applicants, status |
| `/company` | Recruiter companies |
| `/scraped-jobs` | Scraped jobs + admin sources |
| `/career-sources` | Public directory, watchlist, Excel import |
| `/chatbot` | JobMate messages |
| `/stats` | Public platform stats (job counts, companies monitored) |

## Email alerts (Resend)

Set on backend (Render dashboard or `backend/.env`):

```env
RESEND_API_KEY=re_xxxx
EMAIL_FROM=JobVista <notifications@yourdomain.com>
ALERT_DIGEST_CRON=30 14 * * *
```

`ALERT_DIGEST_CRON` runs at **8:00 PM IST** (14:30 UTC). Without `RESEND_API_KEY`, emails are skipped in dev.

## Scraping on Render

Render free tier sets `SKIP_PUPPETEER_SCRAPERS=true` — **~45 API-based sources** sync; **55 auto-puppeteer sources** are skipped. Use recruiter **Sync All** for API scrapers, or run a local sync against Atlas for Puppeteer companies.

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
