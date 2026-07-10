/**
 * End-to-end API test — run with backend on TEST_API_BASE (default localhost:8000)
 */
import dotenv from "dotenv";

dotenv.config();

const API = process.env.TEST_API_BASE || "http://localhost:8000";
const ts = Date.now();
const studentEmail = `e2e-student-${ts}@test.com`;
const recruiterEmail = `e2e-recruiter-${ts}@test.com`;
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

class Client {
  constructor() {
    this.cookie = "";
  }

  async req(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (this.cookie) headers.Cookie = this.cookie;
    if (options.body && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    const res = await fetch(`${API}${path}`, {
      ...options,
      headers,
      body:
        options.body && !(options.body instanceof FormData)
          ? JSON.stringify(options.body)
          : options.body,
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
  const recruiter = new Client();
  const otherRecruiter = new Client();
  let jobId = null;
  let applicationId = null;
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
      jobId = jobsData.jobs.find((j) => !String(j._id).includes("-"))?._id;
    } else {
      fail("GET /job/get", "No jobs returned");
    }

    // External job detail
    if (externalJobId) {
      const ext = await fetch(`${API}/api/v1/job/get/${externalJobId}`);
      const extData = await ext.json();
      ext.ok && extData.success && extData.job?.applicationLink
        ? pass("GET /job/get/:id (Remotive)", extData.job.title)
        : fail("GET /job/get/:id (Remotive)", extData?.message);
    } else {
      fail("GET /job/get/:id (Remotive)", "No remotive job in feed");
    }

    // Scraped job detail
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

    // Career sources
    const cs = await fetch(`${API}/api/v1/career-sources/`);
    const csData = await cs.json();
    const sources = csData.sources || csData;
    Array.isArray(sources) && sources.length >= 90
      ? pass("GET /career-sources", `${sources.length} companies`)
      : fail("GET /career-sources");

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

    // Recruiter register
    r = await recruiter.req("/api/v1/user/register", {
      method: "POST",
      body: {
        fullname: "E2E Recruiter",
        email: recruiterEmail,
        phoneNumber: "9876543211",
        password,
        role: "recruiter",
      },
    });
    r.res.ok && r.data.success ? pass("Recruiter register") : fail("Recruiter register", r.data?.message);

    // Other recruiter for auth test
    r = await otherRecruiter.req("/api/v1/user/register", {
      method: "POST",
      body: {
        fullname: "Other Recruiter",
        email: `e2e-other-${ts}@test.com`,
        phoneNumber: "9876543212",
        password,
        role: "recruiter",
      },
    });
    r.res.ok ? pass("Second recruiter register") : fail("Second recruiter register");

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

    // Recruiter: create company + job
    r = await recruiter.req("/api/v1/company/register", {
      method: "POST",
      body: { companyName: `E2E Co ${ts}` },
    });
    const companyId = r.data?.company?._id;
    r.res.ok && companyId ? pass("Create company") : fail("Create company", r.data?.message);

    if (companyId) {
      r = await recruiter.req("/api/v1/job/post", {
        method: "POST",
        body: {
          title: "E2E Backend Developer",
          description: "Node.js backend engineer role for testing",
          requirements: "Node,Express,MongoDB",
          salary: "12",
          location: "Bangalore",
          jobType: "Full-time",
          experience: "2",
          position: "2",
          companyId,
        },
      });
      jobId = r.data?.job?._id || jobId;
      r.res.ok && r.data.success ? pass("Post internal job") : fail("Post internal job", r.data?.message);
    }

    // Student apply to internal job
    if (jobId && !String(jobId).includes("-")) {
      r = await student.req(`/api/v1/application/apply/${jobId}`);
      r.res.ok && r.data.success ? pass("Student apply to job") : fail("Student apply", r.data?.message);

      // Block apply to scraped job
      if (scrapedJobId) {
        r = await student.req(`/api/v1/application/apply/${scrapedJobId}`);
        r.res.status === 400 ? pass("Block apply on scraped job") : fail("Block apply on scraped job", `status ${r.res.status}`);
      }

      // Recruiter views applicants
      r = await recruiter.req(`/api/v1/application/${jobId}/applicants`);
      applicationId = r.data?.job?.applications?.[0]?._id;
      r.res.ok && r.data.success ? pass("Recruiter view applicants") : fail("Recruiter view applicants", r.data?.message);

      // Other recruiter denied
      r = await otherRecruiter.req(`/api/v1/application/${jobId}/applicants`);
      r.res.status === 403 ? pass("Applicant list blocked for non-owner") : fail("Applicant auth", `status ${r.res.status}`);

      // Update status
      if (applicationId) {
        r = await recruiter.req(`/api/v1/application/status/${applicationId}/update`, {
          method: "POST",
          body: { status: "accepted" },
        });
        r.res.ok && r.data.success ? pass("Update application status") : fail("Update status", r.data?.message);

        r = await otherRecruiter.req(`/api/v1/application/status/${applicationId}/update`, {
          method: "POST",
          body: { status: "rejected" },
        });
        r.res.status === 403 ? pass("Status update blocked for non-owner") : fail("Status auth", `status ${r.res.status}`);
      }
    } else {
      fail("Apply flow", "No internal job id");
    }

    // Recruiter cannot apply
    if (jobId && !String(jobId).includes("-")) {
      r = await recruiter.req(`/api/v1/application/apply/${jobId}`);
      r.res.status === 403 ? pass("Recruiter blocked from applying") : fail("Recruiter apply block", `status ${r.res.status}`);
    }

    // Watchlist
    r = await student.req("/api/v1/career-sources/lists", {
      method: "POST",
      body: { companyName: "Razorpay", listType: "watchlist" },
    });
    r.res.ok && r.data.success ? pass("Add watchlist") : fail("Add watchlist", r.data?.message);

    // Scrape sources (recruiter)
    r = await recruiter.req("/api/v1/scraped-jobs/sources");
    r.res.ok && r.data.sources?.length >= 90
      ? pass("Recruiter scrape sources list", `${r.data.sources.length} sources`)
      : fail("Scrape sources list");

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
