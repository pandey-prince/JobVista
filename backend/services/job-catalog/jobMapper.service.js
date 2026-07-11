import { ScrapedJob } from "../../models/scrapedJob.model.js";
import { filterItJobs } from "../../utils/itJobFilter.js";
import { filterIndiaJobs } from "../../utils/indiaJobFilter.js";
import { cleanJobText, extractExperienceFromTitle } from "../../utils/jobText.js";
import { attachBadgesToJob } from "../../utils/jobBadges.js";

const normalizeDedupeText = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\/$/, "");

export const mapScrapedJobForList = (job) => {
  const description = cleanJobText(job.description, { maxLength: 400 });

  return attachBadgesToJob(
    {
      _id: `scraped-${job._id}`,
      title: job.title,
      description,
      requirements: job.requirements || [],
      experienceLevel: extractExperienceFromTitle(job.title) || "Not specified",
      salary: job.salary || "Not disclosed",
      location: job.location,
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
      applicationLink: job.applicationUrl,
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

  // #region agent log
  fetch("http://127.0.0.1:7533/ingest/ab9d03cf-9a58-4f5a-9174-f3b9b67f6bd5", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "adbcde" },
    body: JSON.stringify({
      sessionId: "adbcde",
      runId: "post-fix",
      hypothesisId: "H1",
      location: "jobMapper.service.js:getScrapedJobsForList:entry",
      message: "getScrapedJobsForList called",
      data: { keyword, hasNormalizeFn: typeof normalizeDedupeText === "function" },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  const jobs = await ScrapedJob.find(query)
    .populate("source")
    .sort({ firstSeenAt: -1 })
    .limit(500);

  const filtered = dedupeScrapedJobs(filterIndiaJobs(filterItJobs(jobs)));
  const mapped = filtered.map(mapScrapedJobForList);

  // #region agent log
  fetch("http://127.0.0.1:7533/ingest/ab9d03cf-9a58-4f5a-9174-f3b9b67f6bd5", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "adbcde" },
    body: JSON.stringify({
      sessionId: "adbcde",
      runId: "post-fix",
      hypothesisId: "H1",
      location: "jobMapper.service.js:getScrapedJobsForList:exit",
      message: "getScrapedJobsForList succeeded",
      data: { rawCount: jobs.length, dedupedCount: filtered.length, mappedCount: mapped.length },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return mapped;
};

export const sortJobsByDate = (jobs = []) =>
  [...jobs].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
