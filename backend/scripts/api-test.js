import dotenv from "dotenv";
import * as XLSX from "xlsx";
import { parseCareerSourcesSpreadsheet } from "../utils/parseCareerSourcesSpreadsheet.js";
import { isItJob } from "../utils/itJobFilter.js";

dotenv.config();

const API_BASE = process.env.TEST_API_BASE || "http://localhost:8000";
const results = [];

const pass = (name, detail = "") => {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
};

const fail = (name, detail = "") => {
  results.push({ name, ok: false, detail });
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ""}`);
};

class CookieClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cookie = "";
  }

  async request(path, options = {}) {
    const headers = {
      ...(options.headers || {}),
    };
    if (this.cookie) headers.Cookie = this.cookie;
    if (options.body && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
      body:
        options.body && !(options.body instanceof FormData)
          ? JSON.stringify(options.body)
          : options.body,
    });

    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      this.cookie = setCookie.split(";")[0];
    }

    let data = null;
    const text = await response.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    return { response, data };
  }
}

const run = async () => {
  console.log("\n=== JobVista Full API Test Suite ===\n");
  const ts = Date.now();
  const student = new CookieClient(API_BASE);
  const recruiter = new CookieClient(API_BASE);

  try {
    const health = await fetch(`${API_BASE}/home`);
    const healthData = await health.json();
    health.ok && healthData.success
      ? pass("Health check /home")
      : fail("Health check /home", `Status ${health.status}`);

    const jobsPublic = await fetch(`${API_BASE}/api/v1/job/get`);
    const jobsData = await jobsPublic.json();
    jobsPublic.ok && jobsData.success
      ? pass("GET /api/v1/job/get", `${jobsData.jobs?.length || 0} jobs`)
      : fail("GET /api/v1/job/get");

    const sourcesPublic = await fetch(`${API_BASE}/api/v1/career-sources/`);
    const sourcesData = await sourcesPublic.json();
    sourcesPublic.ok && sourcesData.success
      ? pass("GET /api/v1/career-sources", `${sourcesData.sources?.length || 0} companies`)
      : fail("GET /api/v1/career-sources");

    const detectRes = await fetch(`${API_BASE}/api/v1/career-sources/detect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://boards.greenhouse.io/stripe" }),
    });
    const detectData = await detectRes.json();
    detectRes.ok && detectData.scraperType === "greenhouse"
      ? pass("POST /career-sources/detect", detectData.scraperType)
      : fail("POST /career-sources/detect");

    const studentReg = await student.request("/api/v1/user/register", {
      method: "POST",
      body: {
        fullname: "Test Student",
        email: `student${ts}@test.com`,
        password: "Test@1234",
        phoneNumber: 9876543210,
        role: "student",
      },
    });
    studentReg.response.ok && studentReg.data.success
      ? pass("POST /user/register (student)")
      : fail("POST /user/register (student)", studentReg.data?.message);

    const me = await student.request("/api/v1/user/me");
    me.response.ok && me.data.success && me.data.user?.email
      ? pass("GET /user/me", me.data.user.email)
      : fail("GET /user/me", me.data?.message);

    const publicStats = await fetch(`${API_BASE}/api/v1/stats/public`);
    const statsData = await publicStats.json();
    publicStats.ok && statsData.success && typeof statsData.stats?.totalJobs === "number"
      ? pass("GET /stats/public", `${statsData.stats.totalJobs} jobs`)
      : fail("GET /stats/public", statsData?.message);

    const recruiterReg = await recruiter.request("/api/v1/user/register", {
      method: "POST",
      body: {
        fullname: "Test Recruiter",
        email: `recruiter${ts}@test.com`,
        password: "Test@1234",
        phoneNumber: 9876543211,
        role: "recruiter",
      },
    });
    recruiterReg.response.ok && recruiterReg.data.success
      ? pass("POST /user/register (recruiter)")
      : fail("POST /user/register (recruiter)", recruiterReg.data?.message);

    const submitCareer = await student.request("/api/v1/career-sources/submit", {
      method: "POST",
      body: {
        url: "https://boards.greenhouse.io/postman",
        companyName: "Postman",
        addToWatchlist: true,
      },
    });
    submitCareer.response.ok && submitCareer.data.success
      ? pass("POST /career-sources/submit", submitCareer.data.source?.companyName)
      : fail("POST /career-sources/submit", submitCareer.data?.message);

    const watchlist = await student.request("/api/v1/career-sources/lists?type=watchlist");
    watchlist.response.ok && watchlist.data.lists?.length > 0
      ? pass("GET /career-sources/lists (watchlist)", `${watchlist.data.lists.length} entries`)
      : fail("GET /career-sources/lists (watchlist)");

    const wishlistAdd = await student.request("/api/v1/career-sources/lists", {
      method: "POST",
      body: {
        listType: "wishlist",
        companyName: "Dream Company",
        notes: "Future goal",
      },
    });
    wishlistAdd.response.ok && wishlistAdd.data.success
      ? pass("POST /career-sources/lists (wishlist)")
      : fail("POST /career-sources/lists (wishlist)", wishlistAdd.data?.message);

    const watchlistJobs = await student.request(
      "/api/v1/career-sources/lists/jobs?type=watchlist"
    );
    watchlistJobs.response.ok
      ? pass("GET /career-sources/lists/jobs", `${watchlistJobs.data.jobs?.length || 0} jobs`)
      : fail("GET /career-sources/lists/jobs");

    const scrapedList = await fetch(`${API_BASE}/api/v1/scraped-jobs`);
    const scrapedData = await scrapedList.json();
    scrapedList.ok && scrapedData.success
      ? pass("GET /scraped-jobs", `${scrapedData.jobs?.length || 0} jobs`)
      : fail("GET /scraped-jobs");

    const adminSources = await recruiter.request("/api/v1/scraped-jobs/sources");
    adminSources.response.ok && adminSources.data.sources?.length > 0
      ? pass("GET /scraped-jobs/sources (recruiter)", `${adminSources.data.sources.length} sources`)
      : fail("GET /scraped-jobs/sources (recruiter)", adminSources.data?.message);

    const workbookData = [
      ["companyName", "careerUrl"],
      [`ExcelCo${ts}`, "https://jobs.lever.co/cred"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(workbookData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Companies");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const parsed = parseCareerSourcesSpreadsheet(buffer);
    parsed.length === 1
      ? pass("Excel parser unit test")
      : fail("Excel parser unit test");

    const formData = new FormData();
    formData.append("file", new Blob([buffer]), "companies.xlsx");
    const excelImport = await recruiter.request("/api/v1/career-sources/import/excel", {
      method: "POST",
      body: formData,
    });
    excelImport.response.ok && excelImport.data.success
      ? pass("POST /career-sources/import/excel", `${excelImport.data.summary?.total} rows`)
      : fail("POST /career-sources/import/excel", excelImport.data?.message);

    isItJob({ title: "Software Engineer" }) && !isItJob({ title: "Marketing Manager" })
      ? pass("IT job filter")
      : fail("IT job filter");

    const logout = await student.request("/api/v1/user/logout", { method: "POST" });
    logout.response.ok ? pass("POST /user/logout") : fail("POST /user/logout");
  } catch (error) {
    fail("Test suite crashed", error.message);
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== Results: ${results.length - failed.length}/${results.length} passed ===\n`);
  process.exit(failed.length > 0 ? 1 : 0);
};

run();
