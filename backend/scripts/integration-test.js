import dotenv from "dotenv";
import mongoose from "mongoose";
import { JobSource } from "../models/jobSource.model.js";
import { ScrapedJob } from "../models/scrapedJob.model.js";
import { syncAllSources } from "../services/scrapeSync.service.js";
import { getScrapedJobsForList } from "../services/job-catalog/index.js";
import { runScraper } from "../services/scrapers/index.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/jobvista-test";

const results = [];

const pass = (name, detail = "") => {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
};

const fail = (name, detail = "") => {
  results.push({ name, ok: false, detail });
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ""}`);
};

const run = async () => {
  console.log("\n=== JobVista Integration Test ===\n");

  try {
    await mongoose.connect(MONGO_URI);
    pass("MongoDB connection");

    const sources = await JobSource.find();
    pass("Job sources in DB", `${sources.length} source(s)`);

    if (sources.length === 0) {
      fail("Job sources seeded", "No sources found — run server once to seed");
    } else {
      for (const source of sources) {
        console.log(`  • ${source.name} (${source.scraperType}) — ${source.url}`);
      }
    }

    for (const type of ["greenhouse", "lever", "ashby"]) {
      const source = sources.find((s) => s.scraperType === type);
      if (!source) continue;
      try {
        const jobs = await runScraper(source);
        pass(`${type} scraper`, `${jobs.length} jobs from ${source.companyName}`);
      } catch (error) {
        fail(`${type} scraper`, error.message);
      }
    }

    console.log("\nRunning full sync (may take ~10s)...");
    const summary = await syncAllSources();
    pass(
      "Full sync",
      `${summary.successful}/${summary.totalSources} sources OK, ${summary.newJobsCount} new jobs, ${summary.removedFromBoard || 0} removed from board`,
    );

    const activeJobs = await ScrapedJob.countDocuments({ status: "active" });
    pass("Active scraped jobs in DB", String(activeJobs));

    const listJobs = await getScrapedJobsForList("");
    pass("getScrapedJobsForList", `${listJobs.length} jobs mapped for frontend`);

    if (listJobs.length > 0) {
      const sample = listJobs[0];
      if (String(sample._id).startsWith("scraped-")) {
        pass("Scraped job ID format", sample._id);
      } else {
        fail("Scraped job ID format", `Expected scraped- prefix, got ${sample._id}`);
      }
      if (sample.external && sample.applicationLink) {
        pass("Scraped job card shape", sample.title);
      } else {
        fail("Scraped job card shape", "Missing external or applicationLink");
      }
    }

    const API_BASE = process.env.TEST_API_BASE || "http://localhost:8000";
    try {
      const health = await fetch(`${API_BASE}/home`);
      if (health.ok) pass("Backend server /home", await health.json().then((d) => d.message));
      else fail("Backend server /home", `Status ${health.status}`);
    } catch {
      fail("Backend server /home", "Server not running — start with npm run dev");
    }

    try {
      const jobsRes = await fetch(`${API_BASE}/api/v1/job/get`);
      const jobsData = await jobsRes.json();
      const scrapedInList = jobsData.jobs?.filter((j) =>
        String(j._id).startsWith("scraped-")
      );
      if (jobsRes.ok && jobsData.success) {
        pass(
          "GET /api/v1/job/get",
          `${jobsData.jobs?.length || 0} total, ${scrapedInList?.length || 0} scraped`
        );
      } else {
        fail("GET /api/v1/job/get", jobsData.message || "Failed");
      }

      if (scrapedInList?.length > 0) {
        const id = scrapedInList[0]._id.replace("scraped-", "");
        const detailRes = await fetch(`${API_BASE}/api/v1/scraped-jobs/${id}`);
        const detailData = await detailRes.json();
        if (detailRes.ok && detailData.success) {
          pass("GET /api/v1/scraped-jobs/:id", detailData.job?.title);
        } else {
          fail("GET /api/v1/scraped-jobs/:id", detailData.message);
        }
      }
    } catch (error) {
      fail("Job API endpoints", error.message);
    }
  } catch (error) {
    fail("Test suite", error.message);
  } finally {
    await mongoose.disconnect();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== Results: ${results.length - failed.length}/${results.length} passed ===\n`);
  process.exit(failed.length > 0 ? 1 : 0);
};

run();
