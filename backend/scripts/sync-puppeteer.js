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

const parseShardOptions = () => {
  const shardIndex = Number(process.env.PUPPETEER_SHARD);
  const shardCount = Number(process.env.PUPPETEER_SHARD_COUNT);

  if (
    Number.isInteger(shardIndex) &&
    Number.isInteger(shardCount) &&
    shardCount > 1 &&
    shardIndex >= 0 &&
    shardIndex < shardCount
  ) {
    return { shardIndex, shardCount };
  }

  return {};
};

const run = async () => {
  if (!MONGO_URI) {
    console.error("MONGO_URI is required");
    process.exit(1);
  }

  const shardOptions = parseShardOptions();
  const shardLabel =
    shardOptions.shardCount > 1
      ? ` (shard ${shardOptions.shardIndex + 1}/${shardOptions.shardCount})`
      : "";

  console.log(`\n=== JobVista Puppeteer source sync${shardLabel} ===\n`);

  try {
    await mongoose.connect(MONGO_URI);
    const summary = await syncSourcesByMode("puppeteer", {
      runPostSyncTasks: false,
      ...shardOptions,
    });
    console.log("\nSummary:", JSON.stringify(summary, null, 2));

    if (summary.totalSources === 0) {
      console.log("No puppeteer sources to sync.");
      process.exit(0);
    }

    const minSuccess = Number(process.env.PUPPETEER_MIN_SUCCESS || 1);
    const failOnPartial = process.env.PUPPETEER_FAIL_ON_PARTIAL === "true";

    if (summary.failed > 0) {
      const failedNames = summary.results
        .filter((r) => !r.success && !r.skipped)
        .map((r) => `${r.sourceName}: ${r.error || "unknown"}`)
        .slice(0, 15);
      console.warn(
        `\n${summary.failed}/${summary.totalSources} puppeteer source(s) failed (common for auto-puppeteer):`,
      );
      for (const line of failedNames) console.warn(`  - ${line}`);
      if (summary.failed > failedNames.length) {
        console.warn(`  ... and ${summary.failed - failedNames.length} more`);
      }
    }

    if (summary.successful < minSuccess) {
      console.error(
        `Puppeteer sync unusable: only ${summary.successful}/${summary.totalSources} succeeded (need at least ${minSuccess}).`,
      );
      process.exit(1);
    }

    if (failOnPartial && summary.failed > 0) {
      process.exit(1);
    }

    console.log(
      `\nPuppeteer sync finished: ${summary.successful}/${summary.totalSources} sources OK, ${summary.newJobsCount} new jobs.`,
    );
    process.exit(0);
  } catch (error) {
    console.error("Puppeteer sync failed:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
};

run();
