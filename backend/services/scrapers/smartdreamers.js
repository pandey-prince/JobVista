import * as cheerio from "cheerio";
import { fetchText } from "./fetchHtml.js";

const MAX_PAGES = Number(process.env.SMARTDREAMERS_MAX_PAGES || 5);

const parseJobsFromHtml = (html, companyName) => {
  const $ = cheerio.load(html);
  const jobs = [];

  $("a.job[href*='reqid/']").each((_, element) => {
    const container = $(element);
    const href = container.attr("href");
    const title = container.find(".job-title").first().text().trim();
    const location = container.find(".job-location").text().replace(/\s+/g, " ").trim();
    const reqId = href?.match(/reqid\/([^/?]+)/i)?.[1];

    if (!title || !href || !reqId) return;

    jobs.push({
      externalId: reqId,
      title,
      description: `${title} at ${companyName}${location ? ` — ${location}` : ""}`,
      location: location || "Not specified",
      jobType: "Full-time",
      salary: "Not disclosed",
      requirements: [],
      applicationUrl: href.split("?")[0],
      companyName,
      companyLogo: "",
    });
  });

  return jobs;
};

export const scrapeSmartdreamers = async (source) => {
  const baseUrl = source.url.replace(/\?.*$/, "");
  const jobs = [];
  const seen = new Set();

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const pageUrl = `${baseUrl}?per_page=100&page=${page}`;
    const html = await fetchText(pageUrl);
    const pageJobs = parseJobsFromHtml(html, source.companyName);

    if (!pageJobs.length) break;

    for (const job of pageJobs) {
      if (seen.has(job.externalId)) continue;
      seen.add(job.externalId);
      jobs.push(job);
    }
  }

  if (!jobs.length) {
    return [];
  }

  return jobs;
};
