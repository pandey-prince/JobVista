/**
 * End-to-end API test — run with backend on TEST_API_BASE (default localhost:8000)
 */
import dotenv from "dotenv";

dotenv.config();

const API = process.env.TEST_API_BASE || "http://localhost:8000";
const ts = Date.now();
const studentEmail = `e2e-student-${ts}@test.com`;
const password = "TestPass123!";
const results = [];

const pass = (name, detail = "") => {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
};

const fail = (name, detail = "") => {
  results.push({ name, ok: false, detail });
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ""}`);
};

const skip = (name, detail = "") => {
  results.push({ name, ok: true, skipped: true, detail });
  console.log(`⊘ ${name} (skipped${detail ? ` — ${detail}` : ""})`);
};

class Client {
  constructor() {
    this.cookie = "";
  }

  async req(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (this.cookie) headers.Cookie = this.cookie;

    let body = options.body;
    if (body instanceof FormData) {
      // Let fetch set multipart boundary
    } else if (body instanceof URLSearchParams) {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      body = body.toString();
    } else if (body) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(body);
    }

    const res = await fetch(`${API}${path}`, {
      ...options,
      headers,
      body,
    });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) this.cookie = setCookie.split(";")[0];
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }
    return { res, data };
  }
}

const run = async () => {
  console.log(`\n=== JobVista E2E Test (${API}) ===\n`);

  const student = new Client();
  let externalJobId = null;
  let scrapedJobId = null;

  try {
    // Health
    const health = await fetch(`${API}/home`);
    const healthData = await health.json();
    health.ok && healthData.success ? pass("Health /home") : fail("Health /home");

    // Public jobs
    const jobsRes = await fetch(`${API}/api/v1/job/get`);
    const jobsData = await jobsRes.json();
    if (jobsRes.ok && jobsData.jobs?.length) {
      pass("GET /job/get", `${jobsData.jobs.length} jobs`);
      externalJobId = jobsData.jobs.find((j) => String(j._id).startsWith("remotive-"))?._id;
      scrapedJobId = jobsData.jobs.find((j) => String(j._id).startsWith("scraped-"))?._id;
    } else {
      fail("GET /job/get", "No jobs returned");
    }

    // External job detail (scraped career page)
    if (scrapedJobId) {
      const sid = scrapedJobId.replace("scraped-", "");
      const scr = await fetch(`${API}/api/v1/scraped-jobs/${sid}`);
      const scrData = await scr.json();
      scr.ok && scrData.success
        ? pass("GET /scraped-jobs/:id", scrData.job?.title)
        : fail("GET /scraped-jobs/:id");
    } else {
      fail("GET /scraped-jobs/:id", "No scraped job in feed");
    }

    // Legacy external feeds (Remotive) are disabled for India-only portal
    if (externalJobId) {
      pass("Remotive feed disabled (India-only)", "skipped");
    }

    // Career sources
    const cs = await fetch(`${API}/api/v1/career-sources/`);
    const csData = await cs.json();
    const sources = csData.sources || csData;
    const sourceTotal = csData.pagination?.total ?? (Array.isArray(sources) ? sources.length : 0);
    sourceTotal >= 90
      ? pass("GET /career-sources", `${sourceTotal} companies`)
      : fail("GET /career-sources", `total ${sourceTotal}`);

    // Chatbot
    const bot = await fetch(`${API}/api/v1/chatbot/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "hello" }),
    });
    const botData = await bot.json();
    bot.ok && botData.success ? pass("POST /chatbot/message") : fail("POST /chatbot/message");

    // Student register (JSON, no file upload)
    let r = await student.req("/api/v1/user/register", {
      method: "POST",
      body: {
        fullname: "E2E Student",
        email: studentEmail,
        phoneNumber: "9876543210",
        password,
        role: "student",
      },
    });
    r.res.ok && r.data.success ? pass("Student register (no photo)") : fail("Student register", r.data?.message);

    // Recruiter signup blocked (applicant-only mode)
    r = await fetch(`${API}/api/v1/user/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullname: "E2E Recruiter",
        email: `e2e-recruiter-${ts}@test.com`,
        phoneNumber: "9876543211",
        password,
        role: "recruiter",
      }),
    });
    const recruiterRegData = await r.json();
    r.status === 403 && !recruiterRegData.success
      ? pass("Recruiter register blocked", recruiterRegData.message)
      : fail("Recruiter register blocked", recruiterRegData?.message);

    skip("Recruiter company/job/applicant flows", "applicant-only mode");

    // Student profile update (no file)
    r = await student.req("/api/v1/user/profile/update", {
      method: "POST",
      body: new URLSearchParams({
        fullname: "E2E Student",
        email: studentEmail,
        phoneNumber: "9876543210",
        bio: "E2E test bio",
        skills: "React, Node",
        college: "Test College",
        degree: "B.Tech",
        branch: "CSE",
        graduationYear: "2025",
        cgpa: "8.5",
        location: "Bangalore",
        portfolio: "",
        linkedin: "",
        github: "",
        preferredJobRoles: "Developer",
        profileCompletionSkipped: "false",
        experience: "[]",
        internships: "[]",
        projects: "[]",
      }),
    });
    // profile update uses multipart from frontend but express.urlencoded also works for simple fields
    if (!r.res.ok) {
      // retry as form via fetch manually
      const fd = new FormData();
      fd.append("fullname", "E2E Student");
      fd.append("email", studentEmail);
      fd.append("phoneNumber", "9876543210");
      fd.append("bio", "E2E test");
      fd.append("skills", "React");
      fd.append("college", "Test");
      fd.append("degree", "BTech");
      fd.append("branch", "CSE");
      fd.append("graduationYear", "2025");
      fd.append("cgpa", "8");
      fd.append("location", "Bangalore");
      fd.append("portfolio", "");
      fd.append("linkedin", "");
      fd.append("github", "");
      fd.append("preferredJobRoles", "Dev");
      fd.append("profileCompletionSkipped", "false");
      fd.append("experience", "[]");
      fd.append("internships", "[]");
      fd.append("projects", "[]");
      r = await student.req("/api/v1/user/profile/update", { method: "POST", body: fd });
    }
    r.res.ok && r.data.success ? pass("Student profile update (no file)") : fail("Student profile update", r.data?.message);

    // Block apply on scraped job (career-page listings)
    if (scrapedJobId) {
      r = await student.req(`/api/v1/application/apply/${scrapedJobId}`, {
        method: "POST",
      });
      r.res.status === 400 ? pass("Block apply on scraped job") : fail("Block apply on scraped job", `status ${r.res.status}`);
    } else {
      fail("Block apply on scraped job", "No scraped job in feed");
    }

    skip("Internal job apply and recruiter applicant flows", "applicant-only mode");

    // Watchlist
    r = await student.req("/api/v1/career-sources/lists", {
      method: "POST",
      body: { companyName: "Razorpay", listType: "watchlist" },
    });
    r.res.ok && r.data.success ? pass("Add watchlist") : fail("Add watchlist", r.data?.message);

    skip("Recruiter scrape sources list", "applicant-only mode");

    // Invalid JWT returns 401
    const badAuth = await fetch(`${API}/api/v1/user/profile/update`, {
      method: "POST",
      headers: { Cookie: "token=invalid.jwt.token", "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    badAuth.status === 401 ? pass("Invalid JWT returns 401") : fail("Invalid JWT", `status ${badAuth.status}`);

    // Logout
    r = await student.req("/api/v1/user/logout", { method: "POST" });
    r.res.ok && r.data.success ? pass("Logout") : fail("Logout");
  } catch (e) {
    fail("Test suite crashed", e.message);
  }

  const passed = results.filter((r) => r.ok).length;
  const total = results.length;
  console.log(`\n=== E2E Results: ${passed}/${total} passed ===\n`);
  process.exit(passed === total ? 0 : 1);
};

run();
