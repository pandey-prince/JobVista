/**
 * Sync Puppeteer career sources (auto-puppeteer / puppeteer).
 * Intended for GitHub Actions — set SKIP_PUPPETEER_SCRAPERS=false.
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { syncSourcesByMode } from "../services/scrapeSync.service.js";

dotenv.config();

process.env.SKIP_PUPPETEER_SCRAPERS = "false";
process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = "false";

const MONGO_URI = process.env.MONGO_URI;

const run = async () => {
  if (!MONGO_URI) {
    console.error("MONGO_URI is required");
    process.exit(1);
  }

  console.log("\n=== JobVista Puppeteer source sync ===\n");

  try {
    await mongoose.connect(MONGO_URI);
    const summary = await syncSourcesByMode("puppeteer", { runPostSyncTasks: false });
    console.log("\nSummary:", JSON.stringify(summary, null, 2));
    process.exit(summary.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("Puppeteer sync failed:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
};

run();
