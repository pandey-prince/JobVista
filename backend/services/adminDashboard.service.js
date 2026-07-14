import { JobSource } from "../models/jobSource.model.js";
import { ScrapedJob } from "../models/scrapedJob.model.js";
import { filterItJobs } from "../utils/itJobFilter.js";
import { filterIndiaJobs } from "../utils/indiaJobFilter.js";
import { buildPaginationMeta, parsePagination } from "../utils/pagination.js";
import { isPuppeteerScraperType } from "./scrapeSync.service.js";

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const countVisibleJobs = (jobs = []) => filterIndiaJobs(filterItJobs(jobs)).length;

const runHostForScraper = (scraperType = "") => {
  if (scraperType === "unsupported") {
    return {
      runHost: "none",
      runHostLabel: "Not scraped",
    };
  }
  if (isPuppeteerScraperType(scraperType)) {
    return {
      runHost: "github-puppeteer",
      runHostLabel: "GitHub Actions (Puppeteer)",
    };
  }
  return {
    runHost: "api",
    runHostLabel: "GitHub Actions + Render (API)",
  };
};

/**
 * Human-readable sync health for ops dashboard.
 * syncHealth: ok | waiting | blocked | error
 */
export const deriveSyncHealth = (source = {}) => {
  const status = source.lastScrapeStatus || "never";
  const error = String(source.lastScrapeError || "").trim();
  const jobsFound = Number(source.jobsFoundCount || 0);
  const isPuppeteer = isPuppeteerScraperType(source.scraperType);

  if (source.scraperType === "unsupported") {
    return {
      syncHealth: "blocked",
      syncReason:
        error || "Unsupported portal — automatic scraping not available",
    };
  }

  if (!source.isActive) {
    return {
      syncHealth: "blocked",
      syncReason: error
        ? `Inactive — not on scrape schedule (${error})`
        : "Inactive — not on scrape schedule",
    };
  }

  if (status === "error") {
    return {
      syncHealth: "error",
      syncReason: error || "Last sync failed",
    };
  }

  if (status === "pending") {
    return {
      syncHealth: "waiting",
      syncReason: isPuppeteer
        ? "Queued — waiting for next Puppeteer / priority sync"
        : "Queued — waiting for next sync run",
    };
  }

  if (status === "never") {
    return {
      syncHealth: "waiting",
      syncReason: isPuppeteer
        ? "Never synced — Puppeteer source runs on next GHA bucket"
        : "Never synced — waiting for next API sync run",
    };
  }

  if (status === "success" && jobsFound === 0) {
    return {
      syncHealth: "waiting",
      syncReason: "Last sync found 0 jobs (will retry next schedule)",
    };
  }

  return {
    syncHealth: "ok",
    syncReason: "",
  };
};

const matchesNeedsAttention = (row) => {
  if (row.syncHealth === "blocked" || row.syncHealth === "error") return true;
  if (row.syncHealth === "waiting" && row.lastScrapeStatus === "never") return true;
  return false;
};

const buildSourceQuery = ({ search, status, scraperType, activeOnly }) => {
  const query = {};

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    query.$or = [
      { companyName: regex },
      { name: regex },
      { url: regex },
      { scraperType: regex },
    ];
  }

  if (status) {
    query.lastScrapeStatus = status;
  }

  if (scraperType) {
    query.scraperType = scraperType;
  }

  if (activeOnly === "true" || activeOnly === true) {
    query.isActive = true;
  }

  return query;
};

const sortSources = (rows, sortBy = "companyName") => {
  const sorted = [...rows];

  if (sortBy === "visibleJobs") {
    sorted.sort(
      (a, b) =>
        b.visibleJobsOnSite - a.visibleJobsOnSite ||
        String(a.companyName).localeCompare(String(b.companyName)),
    );
    return sorted;
  }

  if (sortBy === "activeJobsInDb") {
    sorted.sort(
      (a, b) =>
        b.activeJobsInDb - a.activeJobsInDb ||
        String(a.companyName).localeCompare(String(b.companyName)),
    );
    return sorted;
  }

  if (sortBy === "lastScrapedAt") {
    sorted.sort((a, b) => {
      const aTime = a.lastScrapedAt ? new Date(a.lastScrapedAt).getTime() : 0;
      const bTime = b.lastScrapedAt ? new Date(b.lastScrapedAt).getTime() : 0;
      return bTime - aTime;
    });
    return sorted;
  }

  if (sortBy === "jobsFoundCount") {
    sorted.sort(
      (a, b) =>
        (b.jobsFoundCount || 0) - (a.jobsFoundCount || 0) ||
        String(a.companyName).localeCompare(String(b.companyName)),
    );
    return sorted;
  }

  sorted.sort((a, b) => String(a.companyName).localeCompare(String(b.companyName)));
  return sorted;
};

const JOB_COUNT_SELECT =
  "source title location jobType requirements companyName";

const mapSourceBaseRow = (source) => {
  const host = runHostForScraper(source.scraperType);
  const row = {
    _id: source._id,
    name: source.name,
    companyName: source.companyName,
    url: source.url,
    scraperType: source.scraperType,
    isActive: source.isActive,
    isPublic: source.isPublic !== false,
    lastScrapeStatus: source.lastScrapeStatus,
    lastScrapeError: source.lastScrapeError,
    lastScrapedAt: source.lastScrapedAt,
    jobsFoundCount: source.jobsFoundCount || 0,
    priorityPuppeteerSync: Boolean(source.priorityPuppeteerSync),
    sourceOrigin: source.sourceOrigin || "seed",
    regions: Array.isArray(source.regions) ? source.regions : [],
    runHost: host.runHost,
    runHostLabel: host.runHostLabel,
    activeJobsInDb: 0,
    visibleJobsOnSite: 0,
  };
  const health = deriveSyncHealth(row);
  return {
    ...row,
    syncHealth: health.syncHealth,
    syncReason: health.syncReason,
  };
};

const loadJobsBySource = async (sourceIds) => {
  if (!sourceIds.length) return new Map();

  const activeJobs = await ScrapedJob.find({
    source: { $in: sourceIds },
    status: "active",
  }).select(JOB_COUNT_SELECT);

  const jobsBySource = new Map();
  for (const job of activeJobs) {
    const key = String(job.source);
    if (!jobsBySource.has(key)) jobsBySource.set(key, []);
    jobsBySource.get(key).push(job);
  }
  return jobsBySource;
};

const attachJobCounts = async (sources) => {
  const jobsBySource = await loadJobsBySource(sources.map((source) => source._id));

  return sources.map((source) => {
    const base = mapSourceBaseRow(source);
    const sourceJobs = jobsBySource.get(String(source._id)) || [];
    return {
      ...base,
      activeJobsInDb: sourceJobs.length,
      visibleJobsOnSite: countVisibleJobs(sourceJobs),
    };
  });
};

export const getAdminDashboard = async (query = {}) => {
  const paginationQuery = parsePagination(query, {
    defaultPage: 1,
    defaultLimit: 100,
    maxLimit: 500,
  });

  const sourceQuery = buildSourceQuery({
    search: String(query.search || "").trim(),
    status: query.status,
    scraperType: query.scraperType,
    activeOnly: query.activeOnly,
  });

  const allSources = await JobSource.find(sourceQuery).sort({ companyName: 1 });
  const sortBy = query.sortBy || "companyName";
  const needsAttentionOnly =
    query.needsAttention === "true" ||
    query.needsAttention === true ||
    query.health === "attention";
  const needsJobCountsForSort =
    sortBy === "visibleJobs" || sortBy === "activeJobsInDb";

  // Health/summary use JobSource fields only (no job document load).
  const healthRows = allSources.map(mapSourceBaseRow);
  const sourcesNeedingAttention = healthRows.filter(matchesNeedsAttention).length;

  let workingRows = needsAttentionOnly
    ? healthRows.filter(matchesNeedsAttention)
    : healthRows;

  // Only load job docs for all sources when sorting by job counts.
  if (needsJobCountsForSort) {
    workingRows = sortSources(await attachJobCounts(allSources), sortBy);
    if (needsAttentionOnly) {
      workingRows = workingRows.filter(matchesNeedsAttention);
    }
  } else {
    workingRows = sortSources(workingRows, sortBy);
  }

  const skip = paginationQuery.skip;
  const pageSlice = workingRows.slice(skip, skip + paginationQuery.limit);

  let pageSources = pageSlice;
  if (!needsJobCountsForSort) {
    const pageDocs = pageSlice
      .map((row) => allSources.find((source) => String(source._id) === String(row._id)))
      .filter(Boolean);
    const counted = await attachJobCounts(pageDocs);
    const byId = new Map(counted.map((row) => [String(row._id), row]));
    pageSources = pageSlice.map((row) => byId.get(String(row._id)) || row);
  }

  const [totalActiveJobsInDb, lightJobs] = await Promise.all([
    ScrapedJob.countDocuments({ status: "active" }),
    ScrapedJob.find({ status: "active" }).select(JOB_COUNT_SELECT).lean(),
  ]);
  const totalVisibleJobsOnSite = countVisibleJobs(lightJobs);
  const companiesWithVisibleJobs = new Set(
    lightJobs.filter((job) => countVisibleJobs([job]) > 0).map((job) => String(job.source)),
  ).size;

  const summary = {
    totalSources: allSources.length,
    activeSources: allSources.filter((source) => source.isActive).length,
    sourcesWithErrors: allSources.filter((source) => source.lastScrapeStatus === "error")
      .length,
    sourcesNeverSynced: allSources.filter((source) => source.lastScrapeStatus === "never")
      .length,
    sourcesNeedingAttention,
    totalActiveJobsInDb,
    totalVisibleJobsOnSite,
    companiesWithVisibleJobs,
    lastSyncAt: allSources.reduce((latest, source) => {
      if (!source.lastScrapedAt) return latest;
      if (!latest || source.lastScrapedAt > latest) return source.lastScrapedAt;
      return latest;
    }, null),
  };

  return {
    summary,
    sources: pageSources,
    pagination: buildPaginationMeta({
      page: paginationQuery.page,
      limit: paginationQuery.limit,
      total: workingRows.length,
    }),
  };
};

export const getAdminSourcesList = async () => {
  const sources = await JobSource.find().sort({ companyName: 1 });
  return attachJobCounts(sources);
};
