import { Job } from "../models/job.model.js";
import { ScrapedJob } from "../models/scrapedJob.model.js";
import { filterItJobs } from "../utils/itJobFilter.js";
import { attachBadgesToJob } from "../utils/jobBadges.js";
import { mapScrapedJobForList } from "../services/job-catalog/index.js";

const toSearchText = (job) =>
  [
    job.title,
    job.description,
    job.location,
    job.jobType,
    job.experienceLevel,
    job.companyName,
    job.company?.name,
    job.externalSource,
    ...(job.requirements || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

export const getJobKey = (job) => String(job._id || job.jobKey || "");

export const getRecentJobsSince = async (sinceDate) => {
  const since = sinceDate || new Date(0);

  const [internalJobs, scrapedJobs] = await Promise.all([
    Job.find({ createdAt: { $gte: since } }).populate("company"),
    ScrapedJob.find({ status: "active", firstSeenAt: { $gte: since } }).populate(
      "source",
    ),
  ]);

  const mappedInternal = filterItJobs(internalJobs).map((job) =>
    attachBadgesToJob(job, { sourceType: "recruiter", sourceLabel: "JobVista" }),
  );
  const mappedScraped = filterItJobs(scrapedJobs).map(mapScrapedJobForList);

  return [...mappedInternal, ...mappedScraped].map((job) => ({
    ...job,
    jobKey: getJobKey(job),
  }));
};

export const jobMatchesAlert = (job, alert) => {
  const text = toSearchText(job);

  if (alert.keyword && !text.includes(alert.keyword.toLowerCase())) {
    return false;
  }

  if (
    alert.location &&
    !String(job.location || "")
      .toLowerCase()
      .includes(alert.location.toLowerCase())
  ) {
    return false;
  }

  if (
    alert.experienceLevel &&
    !text.includes(alert.experienceLevel.toLowerCase())
  ) {
    return false;
  }

  if (
    alert.companyName &&
    !text.includes(alert.companyName.toLowerCase())
  ) {
    return false;
  }

  if (alert.sourceType) {
    const sourceType = job.badges?.sourceType || "";
    if (sourceType !== alert.sourceType) return false;
  }

  return true;
};

export const filterJobsForAlert = (jobs, alert, excludeKeys = []) => {
  const excluded = new Set(excludeKeys);
  return jobs.filter(
    (job) => !excluded.has(getJobKey(job)) && jobMatchesAlert(job, alert),
  );
};
