import { ScrapedJob } from "../../models/scrapedJob.model.js";
import { filterItJobs } from "../../utils/itJobFilter.js";
import { filterIndiaJobs } from "../../utils/indiaJobFilter.js";
import {
  cleanJobText,
  extractExperienceFromTitle,
  resolveExperienceLevel,
} from "../../utils/jobText.js";
import { normalizeJobLocation } from "../../utils/jobLocation.js";
import { attachBadgesToJob } from "../../utils/jobBadges.js";
import { toPublicApplicationUrl } from "../../utils/applicationUrl.js";

const normalizeDedupeText = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\/$/, "");

const normalizeComparableText = (value = "") =>
  String(value).toLowerCase().trim().replace(/\s+/g, " ");

export const mapScrapedJobForList = (job) => {
  let description = cleanJobText(job.description, { maxLength: 400 });
  const locationNorm = normalizeComparableText(job.location);
  if (
    description &&
    (normalizeComparableText(description) === locationNorm ||
      normalizeComparableText(description) === normalizeComparableText(job.title))
  ) {
    description = "";
  }

  return attachBadgesToJob(
    {
      _id: `scraped-${job._id}`,
      title: job.title,
      description,
      requirements: job.requirements || [],
      experienceLevel:
        job.experienceLevel ||
        resolveExperienceLevel(job) ||
        extractExperienceFromTitle(job.title) ||
        "Not specified",
      salary: job.salary || "Not disclosed",
      location:
        normalizeJobLocation(job.location, { title: job.title }) || "Not specified",
      jobType: job.jobType,
      position: 1,
      company: {
        name: job.companyName,
        logo: job.companyLogo || "",
      },
      createdAt: job.firstSeenAt,
      applications: [],
      external: true,
      externalSource: job.source?.name || job.companyName,
      applicationLink: toPublicApplicationUrl(job.applicationUrl),
      scrapedJobId: job._id,
    },
    {
      sourceType: "career_page",
      sourceLabel: job.source?.name || job.companyName,
    },
  );
};

const dedupeScrapedJobs = (jobs = []) => {
  const sorted = [...jobs].sort(
    (a, b) => new Date(b.firstSeenAt || 0) - new Date(a.firstSeenAt || 0),
  );
  const seenCompanyTitle = new Set();
  const seenUrls = new Set();
  const deduped = [];

  for (const job of sorted) {
    const companyTitleKey = `${normalizeDedupeText(job.companyName)}::${normalizeDedupeText(job.title)}`;
    const urlKey = normalizeDedupeText(job.applicationUrl);

    if (seenCompanyTitle.has(companyTitleKey) || (urlKey && seenUrls.has(urlKey))) {
      continue;
    }

    seenCompanyTitle.add(companyTitleKey);
    if (urlKey) seenUrls.add(urlKey);
    deduped.push(job);
  }

  return deduped;
};

export { dedupeScrapedJobs };

const JOB_LIST_BATCH_SIZE = Math.max(
  50,
  Number(process.env.JOB_LIST_BATCH_SIZE || 500) || 500,
);
const JOB_LIST_MAX_DOCS = Math.max(
  JOB_LIST_BATCH_SIZE,
  Number(process.env.JOB_LIST_MAX_DOCS || 5000) || 5000,
);

const LIST_SELECT =
  "title description location jobType salary requirements applicationUrl companyName companyLogo firstSeenAt status";

/**
 * Load all active scraped jobs in lean batches (no bulk populate).
 * Soft-capped by JOB_LIST_MAX_DOCS so a runaway DB cannot OOM Render.
 */
const fetchActiveJobsBatched = async (query) => {
  const jobs = [];
  let skip = 0;

  while (jobs.length < JOB_LIST_MAX_DOCS) {
    const limit = Math.min(JOB_LIST_BATCH_SIZE, JOB_LIST_MAX_DOCS - jobs.length);
    const batch = await ScrapedJob.find(query)
      .select(LIST_SELECT)
      .sort({ firstSeenAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    if (!batch.length) break;
    jobs.push(...batch);
    skip += batch.length;
    if (batch.length < limit) break;
  }

  return jobs;
};

export const getScrapedJobsForList = async (keyword = "") => {
  const query = { status: "active" };

  if (keyword) {
    const regex = { $regex: keyword, $options: "i" };
    query.$or = [
      { title: regex },
      { description: regex },
      { location: regex },
      { companyName: regex },
    ];
  }

  const jobs = await fetchActiveJobsBatched(query);
  return dedupeScrapedJobs(filterIndiaJobs(filterItJobs(jobs))).map(mapScrapedJobForList);
};

export const sortJobsByDate = (jobs = []) =>
  [...jobs].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
