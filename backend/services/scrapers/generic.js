import * as cheerio from "cheerio";
import { stripHtml } from "./normalize.js";

const resolveUrl = (base, href = "") => {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
};

export const scrapeGeneric = async (source) => {
  const { selectors } = source;
  if (!selectors?.jobList) {
    throw new Error("Generic scraper requires a jobList CSS selector");
  }

  const response = await fetch(source.url, {
    headers: {
      "User-Agent": "JobLeLoBot/1.0 (+https://www.joblelo.online)",
    },
  });

  if (response.status === 404 || response.status === 410) {
    return [];
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const jobs = [];

  $(selectors.jobList).each((_, element) => {
    const container = $(element);
    const title =
      selectors.title ? container.find(selectors.title).first().text().trim() : "";
    const description =
      selectors.description
        ? container.find(selectors.description).first().text().trim()
        : title;
    const location =
      selectors.location
        ? container.find(selectors.location).first().text().trim()
        : "Not specified";
    const linkEl = selectors.link
      ? container.find(selectors.link).first()
      : container.find("a").first();
    const href = linkEl.attr("href") || "";
    const applicationUrl = resolveUrl(source.url, href);

    if (!title || !applicationUrl) return;

    jobs.push({
      externalId: applicationUrl,
      title,
      description: stripHtml(description),
      location,
      jobType: "Full-time",
      salary: "Not disclosed",
      requirements: [],
      applicationUrl,
      companyName: source.companyName,
      companyLogo: "",
    });
  });

  return jobs;
};
