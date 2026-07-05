import { JobSource } from "../models/jobSource.model.js";
import { ScrapedJob } from "../models/scrapedJob.model.js";
import { runScraper } from "./scrapers/index.js";
import { filterItJobs, isItJob } from "../utils/itJobFilter.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const SCRAPE_DELAY_MS = Number(process.env.SCRAPE_DELAY_MS || 1500);
const PUPPETEER_DELAY_MS = Number(process.env.PUPPETEER_DELAY_MS || 3000);
const MAX_JOBS_PER_SOURCE = Number(process.env.MAX_JOBS_PER_SOURCE || 15);

export const syncSource = async (source) => {
  if (!source.isActive || source.scraperType === "unsupported") {
    return {
      sourceId: source._id,
      sourceName: source.name,
      success: true,
      skipped: true,
      reason: "Source inactive or unsupported",
      newJobsCount: 0,
      updatedJobsCount: 0,
      removedJobsCount: 0,
    };
  }

  const now = new Date();
  let newJobsCount = 0;
  let updatedJobsCount = 0;
  let removedJobsCount = 0;

  try {
    const scrapedJobs = filterItJobs(await runScraper(source)).slice(
      0,
      MAX_JOBS_PER_SOURCE
    );
    const seenExternalIds = new Set();

    for (const job of scrapedJobs) {
      seenExternalIds.add(job.externalId);

      const existing = await ScrapedJob.findOne({
        source: source._id,
        externalId: job.externalId,
      });

      if (existing) {
        existing.title = job.title;
        existing.description = job.description;
        existing.location = job.location;
        existing.jobType = job.jobType;
        existing.salary = job.salary;
        existing.requirements = job.requirements;
        existing.applicationUrl = job.applicationUrl;
        existing.companyName = job.companyName;
        existing.companyLogo = job.companyLogo;
        existing.lastSeenAt = now;
        existing.status = "active";
        await existing.save();
        updatedJobsCount += 1;
      } else {
        await ScrapedJob.create({
          ...job,
          source: source._id,
          firstSeenAt: now,
          lastSeenAt: now,
          status: "active",
        });
        newJobsCount += 1;
      }
    }

    const removedResult = await ScrapedJob.updateMany(
      {
        source: source._id,
        status: "active",
        externalId: { $nin: [...seenExternalIds] },
      },
      { status: "removed", lastSeenAt: now }
    );

    removedJobsCount = removedResult.modifiedCount || 0;

    source.lastScrapedAt = now;
    source.lastScrapeStatus = "success";
    source.lastScrapeError = "";
    source.jobsFoundCount = scrapedJobs.length;
    await source.save();

    return {
      sourceId: source._id,
      sourceName: source.name,
      success: true,
      jobsFound: scrapedJobs.length,
      newJobsCount,
      updatedJobsCount,
      removedJobsCount,
    };
  } catch (error) {
    source.lastScrapedAt = now;
    source.lastScrapeStatus = "error";
    source.lastScrapeError = error.message || "Unknown scrape error";
    await source.save();

    return {
      sourceId: source._id,
      sourceName: source.name,
      success: false,
      error: error.message,
      newJobsCount,
      updatedJobsCount,
      removedJobsCount,
    };
  }
};

export const syncAllSources = async () => {
  const sources = await JobSource.find({ isActive: true });
  const results = [];

  for (const source of sources) {
    const result = await syncSource(source);
    results.push(result);
    const delayMs =
      source.scraperType === "auto-puppeteer" || source.scraperType === "puppeteer"
        ? PUPPETEER_DELAY_MS
        : SCRAPE_DELAY_MS;
    await delay(delayMs);
  }

  await cleanupNonItScrapedJobs();

  const summary = {
    totalSources: sources.length,
    successful: results.filter((r) => r.success && !r.skipped).length,
    skipped: results.filter((r) => r.skipped).length,
    failed: results.filter((r) => !r.success).length,
    newJobsCount: results.reduce((sum, r) => sum + (r.newJobsCount || 0), 0),
    results,
  };

  console.log(
    `[ScrapeSync] Completed: ${summary.successful}/${summary.totalSources} sources, ${summary.newJobsCount} new jobs`
  );

  return summary;
};

export const syncSourceById = async (sourceId) => {
  const source = await JobSource.findById(sourceId);
  if (!source) {
    throw new Error("Job source not found");
  }
  return syncSource(source);
};

const cleanupNonItScrapedJobs = async () => {
  const activeJobs = await ScrapedJob.find({ status: "active" });

  for (const job of activeJobs) {
    if (!isItJob(job)) {
      job.status = "removed";
      job.lastSeenAt = new Date();
      await job.save();
    }
  }
};
