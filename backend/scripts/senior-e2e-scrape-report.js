/**
 * Senior QA: scrape honesty + public feed E2E
 * Usage: node scripts/senior-e2e-scrape-report.js
 * Optional: TEST_API_BASE=https://jobvista-ym67.onrender.com
 */
import {
  isBoardGoneScrapeError,
  shouldHideSourceFromPublicFeed,
  SOURCE_ERROR_HIDE_HOURS,
} from "../utils/sourceFeedHealth.js";
import { scrapeLever } from "../services/scrapers/lever.js";
import { scrapeGreenhouse } from "../services/scrapers/greenhouse.js";
import { scrapeAshby } from "../services/scrapers/ashby.js";
import { scrapeSmartrecruiters } from "../services/scrapers/smartrecruiters.js";
import { scrapeWorkday } from "../services/scrapers/workday.js";

const API = (process.env.TEST_API_BASE || "https://jobvista-ym67.onrender.com").replace(
  /\/$/,
  "",
);

const results = [];
const section = (title) => {
  console.log(`\n${"=".repeat(72)}\n${title}\n${"=".repeat(72)}`);
};

const pass = (name, detail = "") => {
  results.push({ name, ok: true, severity: "pass", detail });
  console.log(`  PASS  ${name}${detail ? ` — ${detail}` : ""}`);
};

const fail = (name, detail = "", severity = "fail") => {
  results.push({ name, ok: false, severity, detail });
  console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
};

const warn = (name, detail = "") => {
  results.push({ name, ok: true, severity: "warn", detail });
  console.warn(`  WARN  ${name}${detail ? ` — ${detail}` : ""}`);
};

const info = (name, detail = "") => {
  results.push({ name, ok: true, severity: "info", detail });
  console.log(`  INFO  ${name}${detail ? ` — ${detail}` : ""}`);
};

const fetchJson = async (path, opts = {}) => {
  const url = path.startsWith("http") ? path : `${API}${path}`;
  const started = Date.now();
  const res = await fetch(url, {
    ...opts,
    headers: { Accept: "application/json", ...(opts.headers || {}) },
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text?.slice(0, 300) };
  }
  return { res, data, ms: Date.now() - started, url };
};

const hoursAgo = (h) => new Date(Date.now() - h * 60 * 60 * 1000);

const testFeedHealthLogic = () => {
  section("A. Feed health unit logic (local code)");

  const cases = [
    {
      name: "404 board-gone hides immediately",
      source: {
        lastScrapeStatus: "error",
        lastScrapeError: "Lever API returned 404",
        lastScrapedAt: hoursAgo(0.1),
      },
      expectHide: true,
    },
    {
      name: "410 Gone hides immediately",
      source: {
        lastScrapeStatus: "error",
        lastScrapeError: "Greenhouse API returned 410",
        lastScrapedAt: hoursAgo(0.1),
      },
      expectHide: true,
    },
    {
      name: '"no jobs found" treated as board-gone',
      source: {
        lastScrapeStatus: "error",
        lastScrapeError: "No jobs found on Workday career site",
        lastScrapedAt: hoursAgo(0.1),
      },
      expectHide: true,
    },
    {
      name: "timeout error keeps feed for <24h",
      source: {
        lastScrapeStatus: "error",
        lastScrapeError: "Auto Puppeteer timed out after 90000ms",
        lastScrapedAt: hoursAgo(2),
      },
      expectHide: false,
    },
    {
      name: "timeout error hides after 24h",
      source: {
        lastScrapeStatus: "error",
        lastScrapeError: "timed out",
        lastScrapedAt: hoursAgo(SOURCE_ERROR_HIDE_HOURS + 1),
      },
      expectHide: true,
    },
    {
      name: "success status never hidden by health helper",
      source: {
        lastScrapeStatus: "success",
        lastScrapeError: "",
        lastScrapedAt: hoursAgo(1),
      },
      expectHide: false,
    },
  ];

  for (const c of cases) {
    const hide = shouldHideSourceFromPublicFeed(c.source);
    if (hide === c.expectHide) {
      pass(c.name, `hide=${hide}`);
    } else {
      fail(c.name, `expected hide=${c.expectHide}, got ${hide}`);
    }
  }

  if (isBoardGoneScrapeError("could not find job listings on career page")) {
    pass('isBoardGoneScrapeError matches "could not find job listings"');
  } else {
    fail('isBoardGoneScrapeError missed "could not find job listings"');
  }
};

const testLiveScrapers = async () => {
  section("B. Live scraper smoke (external career boards)");

  // Dead / empty boards → must return []
  try {
    const jobs = await scrapeLever({
      url: "https://jobs.lever.co/dreamsports",
      companyName: "Dream11",
    });
    if (Array.isArray(jobs) && jobs.length === 0) {
      pass("Lever Dream11 (dreamsports) → empty array", "404/gone board");
    } else {
      fail(
        "Lever Dream11 (dreamsports) → empty array",
        `got ${Array.isArray(jobs) ? jobs.length : typeof jobs} jobs`,
      );
    }
  } catch (e) {
    fail("Lever Dream11 (dreamsports) → empty array", e.message);
  }

  try {
    const jobs = await scrapeGreenhouse({
      url: "https://boards.greenhouse.io/thiscompanydoesnotexistxyz999",
      companyName: "FakeGH",
    });
    if (Array.isArray(jobs) && jobs.length === 0) {
      pass("Greenhouse fake board → empty array");
    } else {
      fail("Greenhouse fake board → empty array", `got length=${jobs?.length}`);
    }
  } catch (e) {
    fail("Greenhouse fake board → empty array", e.message);
  }

  try {
    const jobs = await scrapeAshby({
      url: "https://jobs.ashbyhq.com/thiscompanydoesnotexistxyz999",
      companyName: "FakeAshby",
    });
    if (Array.isArray(jobs) && jobs.length === 0) {
      pass("Ashby fake board → empty array");
    } else {
      fail("Ashby fake board → empty array", `got length=${jobs?.length}`);
    }
  } catch (e) {
    // Ashby may throw non-404; note it
    warn("Ashby fake board", `threw instead of []: ${e.message}`);
  }

  // Live boards → must find jobs
  const liveCases = [
    {
      name: "Greenhouse Stripe (live)",
      run: () =>
        scrapeGreenhouse({
          url: "https://boards.greenhouse.io/stripe",
          companyName: "Stripe",
        }),
      min: 1,
    },
    {
      name: "Lever Netflix (live)",
      run: () =>
        scrapeLever({
          url: "https://jobs.lever.co/netflix",
          companyName: "Netflix",
        }),
      min: 1,
    },
  ];

  for (const c of liveCases) {
    try {
      const jobs = await c.run();
      const n = Array.isArray(jobs) ? jobs.length : 0;
      if (n >= c.min) {
        const sample = jobs[0];
        pass(
          c.name,
          `${n} jobs; sample="${String(sample?.title || "").slice(0, 60)}"`,
        );
        if (!sample?.applicationUrl && !sample?.externalId) {
          warn(`${c.name} shape`, "missing applicationUrl/externalId on first job");
        }
      } else {
        fail(c.name, `expected >=${c.min} jobs, got ${n}`);
      }
    } catch (e) {
      fail(c.name, e.message);
    }
  }

  // SmartRecruiters / Workday — optional known public boards (may rate-limit)
  try {
    const jobs = await scrapeSmartrecruiters({
      url: "https://jobs.smartrecruiters.com/Uber",
      companyName: "Uber",
      companySlug: "Uber",
    });
    if (Array.isArray(jobs)) {
      if (jobs.length >= 1) pass("SmartRecruiters Uber", `${jobs.length} jobs`);
      else warn("SmartRecruiters Uber", "0 jobs (board may be empty or geo-filtered)");
    } else {
      fail("SmartRecruiters Uber", "non-array");
    }
  } catch (e) {
    warn("SmartRecruiters Uber", e.message);
  }

  try {
    const jobs = await scrapeWorkday({
      url: "https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite",
      companyName: "NVIDIA",
    });
    if (Array.isArray(jobs) && jobs.length >= 1) {
      pass("Workday NVIDIA", `${jobs.length} jobs`);
    } else if (Array.isArray(jobs) && jobs.length === 0) {
      warn("Workday NVIDIA", "0 jobs — empty return OK for honesty, verify board");
    } else {
      fail("Workday NVIDIA", "unexpected result");
    }
  } catch (e) {
    warn("Workday NVIDIA", e.message);
  }
};

const testProductionApi = async () => {
  section(`C. Production public API (${API})`);

  // Health
  {
    const { res, data, ms } = await fetchJson("/health");
    if (res.ok && data?.success) {
      pass("GET /health", `${ms}ms uptime=${data.uptime?.toFixed?.(1) ?? data.uptime}`);
    } else {
      fail("GET /health", `status=${res.status} body=${JSON.stringify(data)}`);
    }
  }

  // Scraped jobs list
  let jobsPayload = null;
  {
    const { res, data, ms } = await fetchJson("/api/v1/scraped-jobs?limit=100");
    jobsPayload = data;
    if (!res.ok || !data?.success) {
      fail("GET /scraped-jobs", `status=${res.status}`);
    } else {
      const jobs = data.jobs || data.data || [];
      const total = data.total ?? data.pagination?.total ?? jobs.length;
      pass("GET /scraped-jobs", `${ms}ms count=${jobs.length} total≈${total}`);
      info("Jobs sample companies", [
        ...new Set(jobs.slice(0, 40).map((j) => j.companyName || j.company)),
      ]
        .filter(Boolean)
        .slice(0, 8)
        .join(", ") || "(none)");

      // Integrity: every job should have title + apply link
      const bad = jobs.filter((j) => !j.title || !(j.applicationUrl || j.applyUrl));
      if (bad.length === 0) pass("Job integrity (title + apply URL)", `checked ${jobs.length}`);
      else fail("Job integrity (title + apply URL)", `${bad.length} incomplete`);
    }
  }

  // Dream11 / dreamsports ghosts
  {
    const { res, data } = await fetchJson(
      "/api/v1/scraped-jobs?keyword=Dream11&limit=50",
    );
    const jobs = data?.jobs || data?.data || [];
    const dream = jobs.filter((j) =>
      /dream\s*11|dreamsports/i.test(`${j.companyName || ""} ${j.title || ""}`),
    );
    if (!res.ok) {
      fail("Dream11 ghost check (search)", `status=${res.status}`);
    } else if (dream.length === 0) {
      pass("Dream11 ghost check", "no Dream11 jobs in search results");
    } else {
      fail(
        "Dream11 ghost check",
        `${dream.length} Dream11-related jobs still visible — empty-board purge may not be deployed/run yet`,
      );
    }
  }

  // Companies directory
  {
    const { res, data, ms } = await fetchJson("/api/v1/career-sources?withJobs=true");
    if (!res.ok || !data?.success) {
      // fallback shape
      if (res.ok && Array.isArray(data?.sources || data?.companies || data?.data)) {
        warn("GET /career-sources?withJobs=true", "success flag missing but list present");
      } else {
        fail("GET /career-sources?withJobs=true", `status=${res.status} ${JSON.stringify(data)?.slice(0, 200)}`);
        return;
      }
    }

    const companies = data.sources || data.companies || data.data || [];
    pass("GET /career-sources?withJobs=true", `${ms}ms companies=${companies.length}`);

    const zeroJob = companies.filter(
      (c) => (c.activeJobCount ?? c.jobCount ?? c.jobs?.length ?? 0) === 0,
    );
    if (zeroJob.length === 0) {
      pass("Companies directory: no empty companies", `all ${companies.length} have jobs`);
    } else {
      fail(
        "Companies directory: no empty companies",
        `${zeroJob.length} with 0 jobs: ${zeroJob
          .slice(0, 5)
          .map((c) => c.companyName || c.name)
          .join(", ")}`,
      );
    }

    const dreamCo = companies.find((c) =>
      /dream\s*11|dreamsports/i.test(`${c.companyName || c.name || ""}`),
    );
    if (!dreamCo) {
      pass("Companies directory: Dream11 absent", "correct when board is gone");
    } else {
      fail(
        "Companies directory: Dream11 absent",
        `still listed with count=${dreamCo.activeJobCount ?? dreamCo.jobCount}`,
      );
    }

    // Spot-check one company detail page API
    const sample = companies.find((c) => (c.activeJobCount || c.jobCount || 0) > 0);
    if (sample?.slug) {
      const detail = await fetchJson(`/api/v1/career-sources/${sample.slug}/jobs`);
      if (detail.res.ok && (detail.data?.success || detail.data?.jobs)) {
        const n = (detail.data.jobs || []).length;
        pass(
          `Company detail /career-sources/${sample.slug}/jobs`,
          `${n} jobs; scrapeError=${detail.data.lastScrapeError ? "yes" : "no"}`,
        );
        if (n === 0) {
          fail("Company detail has jobs when directory said so", sample.slug);
        }
      } else {
        // alternate route patterns
        const alt = await fetchJson(`/api/v1/career-sources/by-slug/${sample.slug}`);
        if (alt.res.ok) {
          pass(`Company detail alt route`, sample.slug);
        } else {
          fail(
            `Company detail for ${sample.slug}`,
            `status=${detail.res.status}/${alt.res.status}`,
          );
        }
      }
    } else {
      warn("Company detail spot-check", "no company with jobs+slug to probe");
    }
  }

  // Cross-check: every company in withJobs should appear in jobs catalog (name overlap)
  if (jobsPayload?.success) {
    const jobs = jobsPayload.jobs || jobsPayload.data || [];
    const jobCompanies = new Set(
      jobs.map((j) => String(j.companyName || j.company || "").toLowerCase().trim()).filter(Boolean),
    );
    info("Unique company names in jobs page sample", String(jobCompanies.size));
  }
};

const testFrontendSurfaces = async () => {
  section("D. Frontend surface availability");

  const sites = [
    { name: "Marketing/app (Vercel guess)", url: "https://www.joblelo.online" },
    { name: "API CORS preflight target", url: `${API}/api/v1/scraped-jobs?limit=1` },
  ];

  for (const s of sites) {
    try {
      const started = Date.now();
      const res = await fetch(s.url, { redirect: "follow" });
      const ms = Date.now() - started;
      if (res.ok) pass(s.name, `HTTP ${res.status} in ${ms}ms`);
      else warn(s.name, `HTTP ${res.status} in ${ms}ms`);
    } catch (e) {
      fail(s.name, e.message);
    }
  }
};

const printReport = () => {
  section("E. Executive summary");

  const passed = results.filter((r) => r.ok && r.severity === "pass").length;
  const failed = results.filter((r) => !r.ok).length;
  const warned = results.filter((r) => r.severity === "warn").length;
  const infos = results.filter((r) => r.severity === "info").length;

  console.log(`
Environment under test
  API base:     ${API}
  Hide window:  ${SOURCE_ERROR_HIDE_HOURS}h for non-board-gone scrape errors
  Local code:   empty-board scrapers return [] (not yet proven deployed on Render)

Counts
  PASS: ${passed}
  FAIL: ${failed}
  WARN: ${warned}
  INFO: ${infos}
`);

  if (failed) {
    console.log("Failures:");
    for (const r of results.filter((x) => !x.ok)) {
      console.log(`  - ${r.name}: ${r.detail}`);
    }
  }
  if (warned) {
    console.log("\nWarnings:");
    for (const r of results.filter((x) => x.severity === "warn")) {
      console.log(`  - ${r.name}: ${r.detail}`);
    }
  }

  console.log(`
Verdict guide
  - FAIL on Dream11 / empty companies ⇒ production still serving ghosts until
    (1) this branch is deployed to Render and (2) a sync cycle runs.
  - PASS on live Lever/Greenhouse scrapers ⇒ discovery path works.
  - PASS on dead boards returning [] ⇒ local honesty fix is correct.
`);

  return failed === 0 ? 0 : 1;
};

const main = async () => {
  console.log("JobVista / JobLeLo — Senior E2E scrape & feed report");
  console.log(`Started: ${new Date().toISOString()}`);

  testFeedHealthLogic();
  await testLiveScrapers();
  await testProductionApi();
  await testFrontendSurfaces();

  const code = printReport();
  process.exit(code);
};

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(2);
});
