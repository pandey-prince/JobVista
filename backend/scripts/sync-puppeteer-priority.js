/**
 * Sync user-queued Puppeteer career sources (priorityPuppeteerSync=true).
 * Used by scrape-puppeteer-priority.yml and at the start of the daily Puppeteer run.
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { syncPriorityPuppeteerSources } from "../services/scrapeSync.service.js";

dotenv.config();

process.env.SKIP_PUPPETEER_SCRAPERS = "false";
process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = "false";

const MONGO_URI = process.env.MONGO_URI;

const run = async () => {
  if (!MONGO_URI) {
    console.error("MONGO_URI is required");
    process.exit(1);
  }

  console.log("\n=== JobVista priority Puppeteer source sync ===\n");

  try {
    await mongoose.connect(MONGO_URI);
    const summary = await syncPriorityPuppeteerSources();
    console.log("\nSummary:", JSON.stringify(summary, null, 2));

    if (summary.totalSources === 0) {
      console.log("No priority Puppeteer sources queued.");
      process.exit(0);
    }

    if (summary.successful === 0 && summary.failed > 0) {
      console.error("All priority Puppeteer sources failed.");
      process.exit(1);
    }

    console.log(
      `\nPriority sync finished: ${summary.successful}/${summary.totalSources} sources OK, ${summary.newJobsCount} new jobs.`,
    );
    process.exit(0);
  } catch (error) {
    console.error("Priority Puppeteer sync failed:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
};

run();
