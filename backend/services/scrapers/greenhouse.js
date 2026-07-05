import { stripHtml } from "./normalize.js";

const extractBoardToken = (url) => {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts[0] || "";
  } catch {
    return "";
  }
};

export const scrapeGreenhouse = async (source) => {
  const boardToken = extractBoardToken(source.url);
  if (!boardToken) {
    throw new Error("Invalid Greenhouse URL. Expected boards.greenhouse.io/{company}");
  }

  const response = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`
  );

  if (!response.ok) {
    throw new Error(`Greenhouse API returned ${response.status}`);
  }

  const data = await response.json();
  const jobs = Array.isArray(data.jobs) ? data.jobs : [];

  return jobs.map((job) => ({
    externalId: String(job.id),
    title: job.title,
    description: stripHtml(job.content || job.title),
    location: job.location?.name || "Not specified",
    jobType: "Full-time",
    salary: "Not disclosed",
    requirements: [],
    applicationUrl: job.absolute_url,
    companyName: source.companyName,
    companyLogo: "",
  }));
};
