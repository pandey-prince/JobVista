import { scrapeGreenhouse } from "./greenhouse.js";
import { scrapeLever } from "./lever.js";
import { scrapeAshby } from "./ashby.js";
import { scrapeGeneric } from "./generic.js";
import { scrapeTcsIbegin } from "./tcsIbegin.js";
import { scrapeSuccessfactorsRss } from "./successfactorsRss.js";
import { scrapeSmartdreamers } from "./smartdreamers.js";
import { scrapePuppeteer } from "./puppeteer.js";
import { scrapeWorkday } from "./workday.js";
import { scrapeSmartrecruiters } from "./smartrecruiters.js";
import { scrapeAutoPuppeteer } from "./autoPuppeteer.js";
import { normalizeJob } from "./normalize.js";

export const detectScraperType = (url = "") => {
  const lower = url.toLowerCase();
  if (lower.includes("greenhouse.io")) return "greenhouse";
  if (lower.includes("lever.co")) return "lever";
  if (lower.includes("ashbyhq.com")) return "ashby";
  if (lower.includes("ibegin.tcsapps.com")) return "tcs-ibegin";
  if (lower.includes("digitalcareers.infosys.com")) return "smartdreamers";
  if (lower.includes("myworkdayjobs.com")) return "workday";
  if (lower.includes("smartrecruiters.com")) return "smartrecruiters";
  if (lower.includes("/services/rss/job")) return "successfactors-rss";
  if (lower.includes("careers.wipro.com") || lower.includes("careers.hcltech.com"))
    return "successfactors-rss";
  return "generic";
};

const scrapers = {
  greenhouse: scrapeGreenhouse,
  lever: scrapeLever,
  ashby: scrapeAshby,
  generic: scrapeGeneric,
  "tcs-ibegin": scrapeTcsIbegin,
  "successfactors-rss": scrapeSuccessfactorsRss,
  smartdreamers: scrapeSmartdreamers,
  puppeteer: scrapePuppeteer,
  workday: scrapeWorkday,
  smartrecruiters: scrapeSmartrecruiters,
  "auto-puppeteer": scrapeAutoPuppeteer,
};

export const runScraper = async (source) => {
  if (source.scraperType === "unsupported") {
    throw new Error("Career page scraper not configured for this company");
  }

  const scraper = scrapers[source.scraperType];
  if (!scraper) {
    throw new Error(`Unsupported scraper type: ${source.scraperType}`);
  }

  const rawJobs = await scraper(source);
  return rawJobs.map(normalizeJob).filter((job) => job.applicationUrl);
};

export const extractCompanySlugFromUrl = (url = "") => {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts[0] || parsed.hostname.split(".")[0];
  } catch {
    return "Company";
  }
};
