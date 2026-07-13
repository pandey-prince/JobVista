/**
 * Sync Puppeteer career sources (auto-puppeteer / puppeteer).
 * Intended for GitHub Actions — set SKIP_PUPPETEER_SCRAPERS=false.
 *
 * Optional bucket filter (hash(id) % count):
 *   PUPPETEER_BUCKET=0|1|2
 *   PUPPETEER_BUCKET_COUNT=3 (default when BUCKET is set)
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { syncSourcesByMode } from "../services/scrapeSync.service.js";

dotenv.config();

process.env.SKIP_PUPPETEER_SCRAPERS = "false";
process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = "false";

const MONGO_URI = process.env.MONGO_URI;

const parseBucketOptions = () => {
  const rawBucket =
    process.env.PUPPETEER_BUCKET !== undefined
      ? process.env.PUPPETEER_BUCKET
      : process.env.PUPPETEER_SHARD;
  const rawCount =
    process.env.PUPPETEER_BUCKET_COUNT !== undefined
      ? process.env.PUPPETEER_BUCKET_COUNT
      : process.env.PUPPETEER_SHARD_COUNT || "3";

  if (rawBucket === undefined || rawBucket === "") {
    return {};
  }

  const bucketIndex = Number(rawBucket);
  const bucketCount = Number(rawCount);

  if (
    Number.isInteger(bucketIndex) &&
    Number.isInteger(bucketCount) &&
    bucketCount > 1 &&
    bucketIndex >= 0 &&
    bucketIndex < bucketCount
  ) {
    return { bucketIndex, bucketCount };
  }

  return {};
};

const run = async () => {
  if (!MONGO_URI) {
    console.error("MONGO_URI is required");
    process.exit(1);
  }

  const bucketOptions = parseBucketOptions();
  const bucketLabel =
    bucketOptions.bucketCount > 1
      ? ` (bucket ${bucketOptions.bucketIndex}/${bucketOptions.bucketCount})`
      : "";

  console.log(`\n=== JobVista Puppeteer source sync${bucketLabel} ===\n`);

  try {
    await mongoose.connect(MONGO_URI);
    const summary = await syncSourcesByMode("puppeteer", {
      runPostSyncTasks: false,
      ...bucketOptions,
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
