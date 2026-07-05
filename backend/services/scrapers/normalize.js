export const stripHtml = (value = "") =>
  value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

export const normalizeJob = (job) => ({
  externalId: String(job.externalId),
  title: job.title?.trim() || "Untitled Role",
  description: stripHtml(job.description || "").slice(0, 5000) || "No description available.",
  location: job.location?.trim() || "Not specified",
  jobType: job.jobType?.trim() || "Full-time",
  salary: job.salary?.trim() || "Not disclosed",
  requirements: Array.isArray(job.requirements)
    ? job.requirements.filter(Boolean).map(String)
    : [],
  applicationUrl: job.applicationUrl,
  companyName: job.companyName?.trim() || "Company",
  companyLogo: job.companyLogo || "",
});
