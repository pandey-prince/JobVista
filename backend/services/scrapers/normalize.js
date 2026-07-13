import { cleanJobText } from "../../utils/jobText.js";
import { toPublicApplicationUrl } from "../../utils/applicationUrl.js";

export const stripHtml = (value = "") => cleanJobText(value);

export const normalizeJob = (job) => ({
  externalId: String(job.externalId),
  title: job.title?.trim() || "Untitled Role",
  description: cleanJobText(job.description || "", { maxLength: 5000 }) || "No description available.",
  location: job.location?.trim() || "Not specified",
  jobType: job.jobType?.trim() || "Full-time",
  salary: job.salary?.trim() || "Not disclosed",
  requirements: Array.isArray(job.requirements)
    ? job.requirements.filter(Boolean).map((item) => cleanJobText(String(item)))
    : [],
  applicationUrl: toPublicApplicationUrl(job.applicationUrl),
  companyName: job.companyName?.trim() || "Company",
  companyLogo: job.companyLogo || "",
});
