import { JobSource } from "../models/jobSource.model.js";
import { ScrapedJob } from "../models/scrapedJob.model.js";
import { runScraper } from "./scrapers/index.js";
import { filterItJobs, isItJob } from "../utils/itJobFilter.js";
import { processWatchlistAlerts } from "./watchlistAlert.service.js";
import { hardDeleteScrapedJob } from "./scrapedJobCleanup.service.js";
import { checkActiveJobLinks } from "./linkCheck.service.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const SCRAPE_DELAY_MS = Number(process.env.SCRAPE_DELAY_MS || 1500);
const PUPPETEER_DELAY_MS = Number(process.env.PUPPETEER_DELAY_MS || 3000);
const MAX_UPSERTS_PER_SOURCE = Number(
  process.env.MAX_UPSERTS_PER_SOURCE || process.env.MAX_JOBS_PER_SOURCE || 0,
);
const LINK_CHECK_AFTER_SYNC = process.env.LINK_CHECK_AFTER_SYNC !== "false";

const shouldSkipPuppeteer = () =>
  process.env.SKIP_PUPPETEER_SCRAPERS === "true" ||
  process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD === "true";

const limitUpserts = (jobs) => {
  if (!MAX_UPSERTS_PER_SOURCE || MAX_UPSERTS_PER_SOURCE <= 0) return jobs;
  return jobs.slice(0, MAX_UPSERTS_PER_SOURCE);
};

export const syncSource = async (source) => {
  if (
    shouldSkipPuppeteer() &&
    (source.scraperType === "auto-puppeteer" || source.scraperType === "puppeteer")
  ) {
    return {
      sourceId: source._id,
      sourceName: source.name,
      success: true,
      skipped: true,
      reason: "Puppeteer scrapers disabled on this host",
      newJobsCount: 0,
      updatedJobsCount: 0,
      removedJobsCount: 0,
    };
  }

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
  const newJobs = [];

  try {
    const allScrapedJobs = filterItJobs(await runScraper(source));
    const seenExternalIds = new Set(allScrapedJobs.map((job) => job.externalId));
    const jobsToUpsert = limitUpserts(allScrapedJobs);

    for (const job of jobsToUpsert) {
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
        const created = await ScrapedJob.create({
          ...job,
          source: source._id,
          firstSeenAt: now,
          lastSeenAt: now,
          status: "active",
        });
        newJobs.push(created);
        newJobsCount += 1;
      }
    }

    const staleJobs = await ScrapedJob.find({
      source: source._id,
      status: "active",
      externalId: { $nin: [...seenExternalIds] },
    });

    for (const staleJob of staleJobs) {
      await hardDeleteScrapedJob(staleJob, "missing_from_board");
      removedJobsCount += 1;
    }

    source.lastScrapedAt = now;
    source.lastScrapeStatus = "success";
    source.lastScrapeError = "";
    source.jobsFoundCount = allScrapedJobs.length;
    await source.save();

    return {
      sourceId: source._id,
      sourceName: source.name,
      success: true,
      jobsFound: allScrapedJobs.length,
      jobsUpserted: jobsToUpsert.length,
      newJobsCount,
      updatedJobsCount,
      removedJobsCount,
      newJobs,
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

const PUPPETEER_SCRAPER_TYPES = new Set(["auto-puppeteer", "puppeteer"]);

export const isPuppeteerScraperType = (scraperType) =>
  PUPPETEER_SCRAPER_TYPES.has(scraperType);

const filterSourcesByMode = (sources, mode) => {
  if (mode === "api") {
    return sources.filter((source) => !isPuppeteerScraperType(source.scraperType));
  }
  if (mode === "puppeteer") {
    return sources.filter((source) => isPuppeteerScraperType(source.scraperType));
  }
  return sources;
};

/** Stable bucket 0..bucketCount-1 from Mongo id (or string fallback). */
export const puppeteerBucketForId = (id, bucketCount = 3) => {
  const str = String(id || "");
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash % bucketCount;
};

const filterSourcesByBucket = (sources, bucketIndex, bucketCount) => {
  if (
    bucketCount === undefined ||
    bucketCount === null ||
    bucketCount <= 1 ||
    bucketIndex === undefined ||
    bucketIndex === null ||
    !Number.isInteger(bucketIndex) ||
    !Number.isInteger(bucketCount)
  ) {
    return sources;
  }

  return sources.filter(
    (source) => puppeteerBucketForId(source._id, bucketCount) === bucketIndex,
  );
};

const runSyncLoop = async (sources) => {
  const results = [];
  let removedFromBoard = 0;

  for (const source of sources) {
    const result = await syncSource(source);
    results.push(result);
    removedFromBoard += result.removedJobsCount || 0;
    const delayMs = isPuppeteerScraperType(source.scraperType)
      ? PUPPETEER_DELAY_MS
      : SCRAPE_DELAY_MS;
    await delay(delayMs);
  }

  return { results, removedFromBoard };
};

export const syncSourcesByMode = async (mode = "all", options = {}) => {
  const {
    runPostSyncTasks = mode !== "puppeteer",
    bucketIndex,
    bucketCount,
    shardIndex,
    shardCount,
  } = options;
  const resolvedBucketIndex =
    bucketIndex !== undefined && bucketIndex !== null ? bucketIndex : shardIndex;
  const resolvedBucketCount =
    bucketCount !== undefined && bucketCount !== null ? bucketCount : shardCount;

  const allSources = await JobSource.find({ isActive: true });
  const modeSources = filterSourcesByMode(allSources, mode);
  const sources = filterSourcesByBucket(
    modeSources,
    resolvedBucketIndex,
    resolvedBucketCount,
  );
  const { results, removedFromBoard } = await runSyncLoop(sources);

  let nonItRemoved = 0;
  let linkCheckSummary = null;

  if (runPostSyncTasks) {
    nonItRemoved = await cleanupNonItScrapedJobs();

    if (LINK_CHECK_AFTER_SYNC) {
      try {
        linkCheckSummary = await checkActiveJobLinks({
          limit: Number(process.env.LINK_CHECK_POST_SYNC_BATCH || 30),
          onlyStaleHours: 24,
        });
      } catch (error) {
        console.error("[ScrapeSync] Post-sync link check failed:", error.message);
      }
    }
  }

  const usingBuckets =
    Number.isInteger(resolvedBucketCount) &&
    resolvedBucketCount > 1 &&
    Number.isInteger(resolvedBucketIndex);

  const summary = {
    mode,
    bucketIndex: usingBuckets ? resolvedBucketIndex : null,
    bucketCount: usingBuckets ? resolvedBucketCount : null,
    totalSources: sources.length,
    successful: results.filter((r) => r.success && !r.skipped).length,
    skipped: results.filter((r) => r.skipped).length,
    failed: results.filter((r) => !r.success).length,
    newJobsCount: results.reduce((sum, r) => sum + (r.newJobsCount || 0), 0),
    removedFromBoard,
    removedNonIt: nonItRemoved,
    removedDeadLinks: linkCheckSummary?.deleted || 0,
    linkChecksRun: linkCheckSummary?.checked || 0,
    results,
    linkCheckSummary,
  };

  console.log(
    `[ScrapeSync] ${mode} completed${usingBuckets ? ` (bucket ${resolvedBucketIndex}/${resolvedBucketCount})` : ""}: ${summary.successful}/${summary.totalSources} sources, ${summary.newJobsCount} new jobs, ${summary.removedFromBoard} removed from board`,
  );

  if (runPostSyncTasks) {
    try {
      await processWatchlistAlerts(results);
    } catch (error) {
      console.error("[ScrapeSync] Watchlist alerts failed:", error.message);
    }
  }

  return summary;
};

export const syncAllSources = async () => syncSourcesByMode("all");

export const syncSourceById = async (sourceId) => {
  const source = await JobSource.findById(sourceId);
  if (!source) {
    throw new Error("Job source not found");
  }
  const result = await syncSource(source);
  try {
    await processWatchlistAlerts([result]);
  } catch (error) {
    console.error("[ScrapeSync] Watchlist alerts failed:", error.message);
  }
  return result;
};

export const syncPriorityPuppeteerSources = async (options = {}) => {
  const { runPostSyncTasks = true } = options;
  const sources = await JobSource.find({
    isActive: true,
    priorityPuppeteerSync: true,
    scraperType: { $in: [...PUPPETEER_SCRAPER_TYPES] },
  }).sort({ updatedAt: 1 });

  const results = [];

  for (const source of sources) {
    const result = await syncSource(source);
    results.push(result);

    if (result.success && !result.skipped) {
      source.priorityPuppeteerSync = false;
      await source.save();
    }

    await delay(PUPPETEER_DELAY_MS);
  }

  const summary = {
    mode: "puppeteer-priority",
    totalSources: sources.length,
    successful: results.filter((r) => r.success && !r.skipped).length,
    skipped: results.filter((r) => r.skipped).length,
    failed: results.filter((r) => !r.success).length,
    newJobsCount: results.reduce((sum, r) => sum + (r.newJobsCount || 0), 0),
    results,
  };

  console.log(
    `[ScrapeSync] puppeteer-priority completed: ${summary.successful}/${summary.totalSources} sources, ${summary.newJobsCount} new jobs`,
  );

  if (runPostSyncTasks && results.length > 0) {
    try {
      await processWatchlistAlerts(results);
    } catch (error) {
      console.error("[ScrapeSync] Watchlist alerts failed:", error.message);
    }
  }

  return summary;
};

const cleanupNonItScrapedJobs = async () => {
  const activeJobs = await ScrapedJob.find({ status: "active" });
  let removedCount = 0;

  for (const job of activeJobs) {
    if (!isItJob(job)) {
      await hardDeleteScrapedJob(job, "non_it");
      removedCount += 1;
    }
  }

  return removedCount;
};
