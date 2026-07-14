/**
 * One-shot cleanup: hard-delete non-IT / non-India active jobs and cross-source duplicates.
 * Also points AMD JobSource at the India-filtered careers URL when present.
 *
 * Usage:
 *   node scripts/cleanup-ineligible-scraped-jobs.js
 *   node scripts/cleanup-ineligible-scraped-jobs.js --dry-run
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { JobSource } from "../models/jobSource.model.js";
import { ScrapedJob } from "../models/scrapedJob.model.js";
import { isItJob } from "../utils/itJobFilter.js";
import { isIndiaJob } from "../utils/indiaJobFilter.js";
import { hardDeleteScrapedJob } from "../services/scrapedJobCleanup.service.js";
import { resolveScraperConfig } from "../services/careerSource.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.join(__dirname, "..");

const envCandidates = [
  path.join(BACKEND_ROOT, ".env"),
  path.join("C:/Users/princ/Desktop/JobVista/backend/.env"),
];
for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const AMD_INDIA_URL =
  "https://careers.amd.com/careers-home/jobs?page=1&limit=100&country=India&categories=Engineering";

const parseArgs = () => ({
  dryRun: process.argv.includes("--dry-run"),
});

const normalizeKey = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\/$/, "");

const run = async () => {
  const { dryRun } = parseArgs();
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI missing");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected${dryRun ? " (dry-run)" : ""}`);

  const before = await ScrapedJob.countDocuments({ status: "active" });
  console.log(`Active jobs before: ${before}`);

  const activeJobs = await ScrapedJob.find({ status: "active" }).sort({
    firstSeenAt: -1,
  });

  let removedNonIt = 0;
  let removedNonIndia = 0;
  let removedDuplicate = 0;

  // Pass 1: eligibility
  for (const job of activeJobs) {
    if (!isItJob(job)) {
      if (!dryRun) await hardDeleteScrapedJob(job, "non_it");
      removedNonIt += 1;
      continue;
    }
    if (!isIndiaJob(job)) {
      if (!dryRun) await hardDeleteScrapedJob(job, "non_india");
      removedNonIndia += 1;
    }
  }

  // Pass 2: duplicates among remaining active rows (reload)
  const remaining = dryRun
    ? activeJobs.filter((j) => isItJob(j) && isIndiaJob(j))
    : await ScrapedJob.find({ status: "active" }).sort({ firstSeenAt: -1 });

  const seenCompanyTitle = new Set();
  const seenUrls = new Set();

  for (const job of remaining) {
    const companyTitleKey = `${normalizeKey(job.companyName)}::${normalizeKey(job.title)}`;
    const urlKey = normalizeKey(job.applicationUrl);
    const isDup =
      seenCompanyTitle.has(companyTitleKey) ||
      (urlKey && seenUrls.has(urlKey));

    if (isDup) {
      if (!dryRun) await hardDeleteScrapedJob(job, "duplicate");
      removedDuplicate += 1;
      continue;
    }

    seenCompanyTitle.add(companyTitleKey);
    if (urlKey) seenUrls.add(urlKey);
  }

  // AMD India URL on JobSource
  let amdUpdated = false;
  const amd = await JobSource.findOne({ companyName: /^AMD$/i });
  if (amd && amd.url !== AMD_INDIA_URL) {
    console.log(`AMD URL: ${amd.url} → ${AMD_INDIA_URL}`);
    if (!dryRun) {
      const resolved = await resolveScraperConfig(AMD_INDIA_URL, undefined, "AMD");
      amd.url = resolved.url || AMD_INDIA_URL;
      amd.scraperType = resolved.scraperType;
      amd.isActive = resolved.isActive;
      if (resolved.selectors) {
        amd.selectors = { ...(amd.selectors || {}), ...resolved.selectors };
      }
      await amd.save();
      amdUpdated = true;
    } else {
      amdUpdated = true;
    }
  }

  const after = dryRun
    ? before - removedNonIt - removedNonIndia - removedDuplicate
    : await ScrapedJob.countDocuments({ status: "active" });

  console.log(
    JSON.stringify(
      {
        dryRun,
        before,
        after,
        removedNonIt,
        removedNonIndia,
        removedDuplicate,
        amdUpdated,
      },
      null,
      2,
    ),
  );

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
