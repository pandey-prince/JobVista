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

const attachJobCounts = async (sources) => {
  const sourceIds = sources.map((source) => source._id);
  const activeJobs = await ScrapedJob.find({
    source: { $in: sourceIds },
    status: "active",
  }).select("source title description location jobType requirements companyName");

  const jobsBySource = new Map();
  for (const job of activeJobs) {
    const key = String(job.source);
    if (!jobsBySource.has(key)) jobsBySource.set(key, []);
    jobsBySource.get(key).push(job);
  }

  return sources.map((source) => {
    const sourceJobs = jobsBySource.get(String(source._id)) || [];
    const host = runHostForScraper(source.scraperType);
    return {
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
      runHost: host.runHost,
      runHostLabel: host.runHostLabel,
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
  const rowsWithCounts = await attachJobCounts(allSources);
  const sortedRows = sortSources(rowsWithCounts, query.sortBy || "companyName");

  const totalActiveJobsInDb = await ScrapedJob.countDocuments({ status: "active" });
  const allActiveJobs = await ScrapedJob.find({ status: "active" }).select(
    "title description location jobType requirements companyName",
  );
  const totalVisibleJobsOnSite = countVisibleJobs(allActiveJobs);

  const summary = {
    totalSources: allSources.length,
    activeSources: allSources.filter((source) => source.isActive).length,
    sourcesWithErrors: allSources.filter((source) => source.lastScrapeStatus === "error")
      .length,
    sourcesNeverSynced: allSources.filter((source) => source.lastScrapeStatus === "never")
      .length,
    totalActiveJobsInDb,
    totalVisibleJobsOnSite,
    companiesWithVisibleJobs: sortedRows.filter((row) => row.visibleJobsOnSite > 0).length,
    lastSyncAt: allSources.reduce((latest, source) => {
      if (!source.lastScrapedAt) return latest;
      if (!latest || source.lastScrapedAt > latest) return source.lastScrapedAt;
      return latest;
    }, null),
  };

  const skip = paginationQuery.skip;
  const sources = sortedRows.slice(skip, skip + paginationQuery.limit);

  return {
    summary,
    sources,
    pagination: buildPaginationMeta({
      page: paginationQuery.page,
      limit: paginationQuery.limit,
      total: sortedRows.length,
    }),
  };
};

export const getAdminSourcesList = async () => {
  const sources = await JobSource.find().sort({ companyName: 1 });
  return attachJobCounts(sources);
};
