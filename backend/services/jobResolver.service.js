import { ScrapedJob } from "../models/scrapedJob.model.js";
import { isItJob } from "../utils/itJobFilter.js";
import { isIndiaJob } from "../utils/indiaJobFilter.js";
import {
  fetchExternalJobById,
  isExternalJobId,
  mapScrapedJobForList,
} from "../services/job-catalog/index.js";

export const buildJobSnapshot = (job = {}) => ({
  title: job.title || "",
  companyName: job.company?.name || job.companyName || "",
  location: job.location || "",
  salary:
    typeof job.salary === "number" ? `${job.salary} LPA` : job.salary || "",
  applicationLink: job.applicationLink || job.applicationUrl || "",
  sourceType: job.badges?.sourceType || "",
  description: (job.description || "").slice(0, 280),
});

export const resolveJobByKey = async (jobKey) => {
  if (!jobKey) return null;

  if (jobKey.startsWith("scraped-")) {
    const scrapedId = jobKey.replace("scraped-", "");
    const job = await ScrapedJob.findById(scrapedId).populate("source");
    if (!job || job.status !== "active" || !isItJob(job) || !isIndiaJob(job)) return null;
    return mapScrapedJobForList(job);
  }

  if (isExternalJobId(jobKey)) {
    return fetchExternalJobById(jobKey);
  }

  return null;
};

export const snapshotFromPayload = (payload = {}) => {
  const jobKey = payload.jobKey || payload._id;
  if (!jobKey) return null;

  return {
    jobKey: String(jobKey),
    jobSnapshot: buildJobSnapshot(payload),
  };
};
