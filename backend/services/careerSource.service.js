import { JobSource } from "../models/jobSource.model.js";
import {
  detectScraperType,
  extractCompanySlugFromUrl,
} from "./scrapers/index.js";
import { probeCareerSource } from "../utils/probeCareerSource.js";
import { resolveCareerBoard } from "../utils/resolveCareerBoard.js";
import { syncSourceById } from "./scrapeSync.service.js";

export const normalizeCareerUrl = (url = "") => {
  const trimmed = url.trim();
  if (!trimmed) return "";
  const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  parsed.hash = "";
  return parsed.toString().replace(/\/$/, "");
};

const slugCandidatesFromUrl = (url = "") => {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    return [...new Set(parts)];
  } catch {
    return [];
  }
};

export const resolveScraperConfig = async (url, scraperType, companyName = "") => {
  const detected = scraperType || detectScraperType(url);

  const apiTypes = [
    "greenhouse",
    "lever",
    "ashby",
    "tcs-ibegin",
    "successfactors-rss",
    "smartdreamers",
    "workday",
    "smartrecruiters",
    "auto-puppeteer",
    "puppeteer",
  ];

  if (apiTypes.includes(detected)) {
    return { scraperType: detected, isActive: true };
  }

  const resolved = await resolveCareerBoard({
    companyName: companyName || extractCompanySlugFromUrl(url),
    name: companyName || extractCompanySlugFromUrl(url),
    careersUrl: url,
  });

  if (resolved?.isActive) {
    return {
      scraperType: resolved.scraperType,
      isActive: true,
      url: resolved.url,
      selectors: resolved.selectors,
    };
  }

  const probed = await probeCareerSource(slugCandidatesFromUrl(url));
  if (probed) {
    return {
      scraperType: probed.scraperType,
      isActive: true,
      url: probed.url,
    };
  }

  if (detected === "generic") {
    return {
      scraperType: "auto-puppeteer",
      isActive: true,
    };
  }

  return { scraperType: "unsupported", isActive: false };
};

export const createOrGetJobSource = async ({
  url,
  companyName,
  name,
  sourceOrigin = "user",
  submittedBy = null,
  isPublic = true,
  scraperType,
  selectors,
  triggerSync = false,
}) => {
  const normalizedUrl = normalizeCareerUrl(url);
  if (!normalizedUrl) {
    throw new Error("A valid career page URL is required");
  }

  const existing = await JobSource.findOne({ url: normalizedUrl });
  if (existing) {
    if (triggerSync && existing.isActive) {
      await syncSourceById(existing._id);
    }
    return { source: existing, created: false };
  }

  const slug = extractCompanySlugFromUrl(normalizedUrl);
  const resolved = await resolveScraperConfig(normalizedUrl, scraperType, companyName);
  const finalUrl = resolved.url || normalizedUrl;

  const source = await JobSource.create({
    name: name || `${companyName || slug} Careers`,
    companyName: companyName || slug,
    url: finalUrl,
    scraperType: resolved.scraperType,
    selectors: selectors || resolved.selectors || {},
    isActive: resolved.isActive,
    sourceOrigin,
    submittedBy,
    isPublic,
    lastScrapeStatus: resolved.isActive ? "pending" : "never",
    lastScrapeError: resolved.isActive
      ? ""
      : "Career page saved. Automatic scraping is not available for this portal yet.",
  });

  if (triggerSync && source.isActive) {
    await syncSourceById(source._id);
  }

  return { source, created: true };
};

export const listPublicJobSources = async () => {
  return JobSource.find({ isPublic: true }).sort({ companyName: 1 });
};
