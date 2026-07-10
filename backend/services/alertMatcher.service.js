import { ScrapedJob } from "../models/scrapedJob.model.js";
import { filterItJobs } from "../utils/itJobFilter.js";
import { filterIndiaJobs } from "../utils/indiaJobFilter.js";
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

  const scrapedJobs = await ScrapedJob.find({
    status: "active",
    firstSeenAt: { $gte: since },
  }).populate("source");

  return filterIndiaJobs(filterItJobs(scrapedJobs)).map(mapScrapedJobForList).map((job) => ({
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
