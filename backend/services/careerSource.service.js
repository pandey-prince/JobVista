import { JobSource } from "../models/jobSource.model.js";
import {
  detectScraperType,
  extractCompanySlugFromUrl,
} from "./scrapers/index.js";
import { probeCareerSource } from "../utils/probeCareerSource.js";
import { resolveCareerBoard } from "../utils/resolveCareerBoard.js";
import {
  isPuppeteerScraperType,
  syncSourceById,
} from "./scrapeSync.service.js";
import { dispatchPuppeteerPriorityWorkflow } from "../utils/githubWorkflowDispatch.js";

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

const queuePuppeteerPrioritySync = async (source) => {
  source.priorityPuppeteerSync = true;
  source.lastScrapeStatus = "pending";
  source.lastScrapeError = "";
  await source.save();
  const dispatch = await dispatchPuppeteerPriorityWorkflow();
  return dispatch;
};

export const buildCareerSubmitMessage = ({
  created,
  source,
  queuedPuppeteer,
  workflowDispatched,
}) => {
  if (!source.isActive || source.scraperType === "unsupported") {
    return created
      ? "Career page saved. Automatic scraping is not available for this portal yet."
      : "Career page already exists — automatic scraping is not available for this portal yet.";
  }

  if (queuedPuppeteer) {
    const timing = workflowDispatched
      ? "Queued for Puppeteer scrape (CI run started — usually a few minutes)."
      : "Queued for Puppeteer scrape (runs on the next priority or daily Puppeteer sync).";
    return created
      ? `Career page added — ${timing}`
      : `Career page already exists — ${timing}`;
  }

  return created
    ? "Career page added and sync started"
    : "Career page already exists — sync refreshed";
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
  regions = [],
}) => {
  const normalizedUrl = normalizeCareerUrl(url);
  if (!normalizedUrl) {
    throw new Error("A valid career page URL is required");
  }

  const regionList = (Array.isArray(regions) ? regions : [regions])
    .map((region) => String(region || "").trim())
    .filter(Boolean);

  const existing = await JobSource.findOne({ url: normalizedUrl });
  if (existing) {
    let queuedPuppeteer = false;
    let workflowDispatched = false;
    let regionsChanged = false;

    if (regionList.length) {
      const merged = new Set([...(existing.regions || []), ...regionList]);
      const nextRegions = [...merged];
      if (
        nextRegions.length !== (existing.regions || []).length ||
        nextRegions.some((region) => !(existing.regions || []).includes(region))
      ) {
        existing.regions = nextRegions;
        regionsChanged = true;
      }
    }

    if (regionsChanged) {
      await existing.save();
    }

    if (triggerSync && existing.isActive) {
      if (isPuppeteerScraperType(existing.scraperType)) {
        const dispatch = await queuePuppeteerPrioritySync(existing);
        queuedPuppeteer = true;
        workflowDispatched = dispatch.dispatched;
      } else {
        await syncSourceById(existing._id);
      }
    }

    return {
      source: existing,
      created: false,
      queuedPuppeteer,
      workflowDispatched,
    };
  }

  const slug = extractCompanySlugFromUrl(normalizedUrl);
  const resolved = await resolveScraperConfig(normalizedUrl, scraperType, companyName);
  const finalUrl = resolved.url || normalizedUrl;
  const isPuppeteer = isPuppeteerScraperType(resolved.scraperType);

  // Prefer unique URL if resolve changed it and already exists
  const existingFinal = await JobSource.findOne({ url: finalUrl });
  if (existingFinal && finalUrl !== normalizedUrl) {
    if (regionList.length) {
      existingFinal.regions = [
        ...new Set([...(existingFinal.regions || []), ...regionList]),
      ];
      await existingFinal.save();
    }
    return {
      source: existingFinal,
      created: false,
      queuedPuppeteer: false,
      workflowDispatched: false,
    };
  }

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
    regions: regionList,
    priorityPuppeteerSync: isPuppeteer && resolved.isActive && triggerSync,
    lastScrapeStatus: resolved.isActive ? "pending" : "never",
    lastScrapeError: resolved.isActive
      ? ""
      : "Career page saved. Automatic scraping is not available for this portal yet.",
  });

  let queuedPuppeteer = false;
  let workflowDispatched = false;

  if (triggerSync && source.isActive) {
    if (isPuppeteer) {
      const dispatch = await queuePuppeteerPrioritySync(source);
      queuedPuppeteer = true;
      workflowDispatched = dispatch.dispatched;
    } else {
      await syncSourceById(source._id);
    }
  }

  return { source, created: true, queuedPuppeteer, workflowDispatched };
};

export const listPublicJobSources = async () => {
  return JobSource.find({ isPublic: true }).sort({ companyName: 1 });
};
