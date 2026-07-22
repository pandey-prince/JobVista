import { stripHtml } from "./normalize.js";

const extractCompanySlug = (url) => {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts[0] || "";
  } catch {
    return "";
  }
};

export const scrapeLever = async (source) => {
  const companySlug = extractCompanySlug(source.url);
  if (!companySlug) {
    throw new Error("Invalid Lever URL. Expected jobs.lever.co/{company}");
  }

  const response = await fetch(
    `https://api.lever.co/v0/postings/${companySlug}?mode=json`
  );

  // Board removed / company closed careers — treat as empty so sync deletes stale jobs
  if (response.status === 404 || response.status === 410) {
    return [];
  }

  if (!response.ok) {
    throw new Error(`Lever API returned ${response.status}`);
  }

  const jobs = await response.json();
  if (!Array.isArray(jobs)) {
    return [];
  }

  return jobs.map((job) => ({
    externalId: job.id,
    title: job.text,
    description: stripHtml(
      job.descriptionPlain || job.description || job.text
    ),
    location: job.categories?.location || "Not specified",
    jobType: job.categories?.commitment || "Full-time",
    salary: job.categories?.team || "Not disclosed",
    requirements: job.lists?.flatMap((list) =>
      (list.content || "")
        .split(/<li>|<\/li>/)
        .map(stripHtml)
        .filter((item) => item.length > 2)
    ) || [],
    applicationUrl: job.hostedUrl || job.applyUrl,
    companyName: source.companyName,
    companyLogo: "",
  }));
};
