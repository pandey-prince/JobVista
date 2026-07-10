/**
 * Sync API-based career sources (greenhouse, lever, workday, etc.).
 * Render cron uses syncAllSources which skips puppeteer when SKIP_PUPPETEER_SCRAPERS=true.
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { syncSourcesByMode } from "../services/scrapeSync.service.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const run = async () => {
  if (!MONGO_URI) {
    console.error("MONGO_URI is required");
    process.exit(1);
  }

  console.log("\n=== JobVista API source sync ===\n");

  try {
    await mongoose.connect(MONGO_URI);
    const summary = await syncSourcesByMode("api");
    console.log("\nSummary:", JSON.stringify(summary, null, 2));
    process.exit(summary.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("API sync failed:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
};

run();
