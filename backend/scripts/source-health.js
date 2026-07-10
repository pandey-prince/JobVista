/**
 * Report career source sync health from MongoDB.
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { JobSource } from "../models/jobSource.model.js";
import { ScrapedJob } from "../models/scrapedJob.model.js";
import { isPuppeteerScraperType } from "../services/scrapeSync.service.js";

dotenv.config();

const run = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI is required");
    process.exit(1);
  }

  const strict = !process.argv.includes("--report-only");

  await mongoose.connect(mongoUri);

  const sources = await JobSource.find().sort({ companyName: 1 });
  const activeJobs = await ScrapedJob.countDocuments({ status: "active" });

  const byStatus = {};
  const byType = {};
  let apiNever = 0;
  let apiError = 0;
  let apiSuccess = 0;
  let puppeteerCount = 0;

  for (const source of sources) {
    byStatus[source.lastScrapeStatus] = (byStatus[source.lastScrapeStatus] || 0) + 1;
    byType[source.scraperType] = (byType[source.scraperType] || 0) + 1;

    if (isPuppeteerScraperType(source.scraperType)) {
      puppeteerCount += 1;
      continue;
    }

    if (source.lastScrapeStatus === "success") apiSuccess += 1;
    else if (source.lastScrapeStatus === "error") apiError += 1;
    else apiNever += 1;
  }

  console.log("\n=== JobVista source health ===\n");
  console.log(`Total sources: ${sources.length}`);
  console.log(`Active scraped jobs: ${activeJobs}`);
  console.log(`Puppeteer sources (GitHub Actions): ${puppeteerCount}`);
  console.log(`API success: ${apiSuccess}`);
  console.log(`API never synced: ${apiNever}`);
  console.log(`API errors: ${apiError}`);
  console.log("\nBy scrape status:", byStatus);
  console.log("By scraper type:", byType);

  const errors = sources.filter((s) => s.lastScrapeStatus === "error");
  if (errors.length) {
    console.log("\nSources with errors:");
    for (const source of errors.slice(0, 20)) {
      console.log(`  - ${source.companyName} (${source.scraperType}): ${source.lastScrapeError}`);
    }
    if (errors.length > 20) console.log(`  ... and ${errors.length - 20} more`);
  }

  await mongoose.disconnect();

  const unhealthy = strict && (apiError > 0 || apiNever > 0);
  process.exit(unhealthy ? 1 : 0);
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
