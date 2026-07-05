import { fetchJson } from "./fetchHtml.js";

const SEARCH_URL = "https://ibegin.tcsapps.com/candidate/api/v1/jobs/searchJ";
const JOB_URL_BASE = "https://ibegin.tcsapps.com/candidate/jobs";
const TECHNOLOGY_FUNCTION_ID = 2137;

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

export const scrapeTcsIbegin = async (source) => {
  const data = await fetchJson(`${SEARCH_URL}?at=${Date.now()}`, {
    method: "POST",
    body: JSON.stringify(buildSearchBody(1)),
  });

  const jobs = data?.data?.jobs;
  if (!Array.isArray(jobs)) {
    throw new Error("Unexpected TCS iBegin API response");
  }

  return jobs.map((job) => ({
    externalId: job.id,
    title: job.jobTitle,
    description: [job.skills, job.functionName, `${job.experience} years experience`]
      .filter(Boolean)
      .join(" · "),
    location: job.location || "India",
    jobType: "Full-time",
    salary: "Not disclosed",
    requirements: job.skills ? job.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
    applicationUrl: `${JOB_URL_BASE}/${job.id}`,
    companyName: source.companyName,
    companyLogo: "",
  }));
};
