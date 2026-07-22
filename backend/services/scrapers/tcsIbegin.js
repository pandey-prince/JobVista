import { fetchJson } from "./fetchHtml.js";

const SEARCH_URL = "https://ibegin.tcsapps.com/candidate/api/v1/jobs/searchJ";
const JOB_URL_BASE = "https://ibegin.tcsapps.com/candidate/jobs";
const TECHNOLOGY_FUNCTION_ID = 2137;
const MAX_PAGES = Number(process.env.TCS_MAX_PAGES || 50);

const buildSearchBody = (pageNumber = 1) => ({
  jobCity: null,
  jobSkill: null,
  jobFunction: TECHNOLOGY_FUNCTION_ID,
  pageNumber: String(pageNumber),
  userText: "",
  jobTitleOrder: null,
  jobCityOrder: null,
  jobFunctionOrder: null,
  jobExperienceOrder: null,
  applyByOrder: null,
  regular: true,
  walkin: true,
});

const mapJob = (job, companyName) => ({
  externalId: job.id,
  title: job.jobTitle,
  description: [job.skills, job.functionName, `${job.experience} years experience`]
    .filter(Boolean)
    .join(" · "),
  location: job.location || "India",
  jobType: "Full-time",
  salary: "Not disclosed",
  experienceLevel:
    job.experience !== null && job.experience !== undefined && job.experience !== ""
      ? String(job.experience)
      : "",
  requirements: job.skills ? job.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
  applicationUrl: `${JOB_URL_BASE}/${job.id}`,
  companyName,
  companyLogo: "",
});

export const scrapeTcsIbegin = async (source) => {
  const jobs = [];
  const seen = new Set();

  for (let pageNumber = 1; pageNumber <= MAX_PAGES; pageNumber += 1) {
    const data = await fetchJson(`${SEARCH_URL}?at=${Date.now()}`, {
      method: "POST",
      body: JSON.stringify(buildSearchBody(pageNumber)),
    });

    const pageJobs = data?.data?.jobs;
    if (!Array.isArray(pageJobs)) {
      if (pageNumber === 1) {
        throw new Error("Unexpected TCS iBegin API response");
      }
      break;
    }

    if (!pageJobs.length) break;

    let newOnPage = 0;
    for (const job of pageJobs) {
      const mapped = mapJob(job, source.companyName);
      if (!mapped.externalId || seen.has(mapped.externalId)) continue;
      seen.add(mapped.externalId);
      jobs.push(mapped);
      newOnPage += 1;
    }

    if (!newOnPage) break;
  }

  if (!jobs.length) {
    return [];
  }

  return jobs;
};
