import cron from "node-cron";
import { syncSourcesByMode } from "../services/scrapeSync.service.js";

let isRunning = false;

const shouldSkipPuppeteer = () =>
  process.env.SKIP_PUPPETEER_SCRAPERS === "true" ||
  process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD === "true";

const runSyncSafely = async (label) => {
  if (isRunning) {
    console.log(`[ScrapeScheduler] Skipping ${label} — sync already in progress`);
    return;
  }

  isRunning = true;
  try {
    console.log(`[ScrapeScheduler] Starting ${label}`);
    const mode = shouldSkipPuppeteer() ? "api" : "all";
    await syncSourcesByMode(mode);
  } catch (error) {
    console.error(`[ScrapeScheduler] ${label} failed:`, error.message);
  } finally {
    isRunning = false;
  }
};

export const startScrapeScheduler = () => {
  const enabled = process.env.SCRAPE_ENABLED === "true";
  if (!enabled) {
    console.log("[ScrapeScheduler] Disabled (set SCRAPE_ENABLED=true to enable)");
    return;
  }

  const schedule = process.env.SCRAPE_CRON_SCHEDULE || "0 */6 * * *";
  cron.schedule(schedule, () => runSyncSafely("scheduled sync"));

  if (process.env.SCRAPE_ON_BOOT === "true") {
    runSyncSafely("boot sync");
  }

  console.log(`[ScrapeScheduler] Active with schedule: ${schedule}`);
};
