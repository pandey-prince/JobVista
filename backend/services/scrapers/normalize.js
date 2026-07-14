import { cleanJobText } from "../../utils/jobText.js";
import { toPublicApplicationUrl } from "../../utils/applicationUrl.js";
import { normalizeJobLocation } from "../../utils/jobLocation.js";

export const stripHtml = (value = "") => cleanJobText(value);

export const normalizeJob = (job) => {
  const title = job.title?.trim() || "Untitled Role";

  return {
    externalId: String(job.externalId),
    title,
    description:
      cleanJobText(job.description || "", { maxLength: 5000 }) || "No description available.",
    location: normalizeJobLocation(job.location, { title }),
    jobType: job.jobType?.trim() || "Full-time",
    salary: job.salary?.trim() || "Not disclosed",
    requirements: Array.isArray(job.requirements)
      ? job.requirements.filter(Boolean).map((item) => cleanJobText(String(item)))
      : [],
    applicationUrl: toPublicApplicationUrl(job.applicationUrl),
    companyName: job.companyName?.trim() || "Company",
    companyLogo: job.companyLogo || "",
  };
};
