import { stripHtml } from "./normalize.js";

const extractBoardName = (url) => {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts[0] || "";
  } catch {
    return "";
  }
};

export const scrapeAshby = async (source) => {
  const boardName = extractBoardName(source.url);
  if (!boardName) {
    throw new Error("Invalid Ashby URL. Expected jobs.ashbyhq.com/{company}");
  }

  const response = await fetch(
    `https://api.ashbyhq.com/posting-api/job-board/${boardName}`
  );

  if (!response.ok) {
    throw new Error(`Ashby API returned ${response.status}`);
  }

  const data = await response.json();
  const jobs = Array.isArray(data.jobs) ? data.jobs : [];

  return jobs.map((job) => ({
    externalId: job.id,
    title: job.title,
    description: stripHtml(job.descriptionHtml || job.description || job.title),
    location: job.location || job.locationName || "Not specified",
    jobType: job.employmentType || "Full-time",
    salary: job.compensationTierSummary || "Not disclosed",
    requirements: [],
    applicationUrl: job.jobUrl || job.applyUrl,
    companyName: source.companyName,
    companyLogo: "",
  }));
};
