/**
 * Re-probe auto-puppeteer sources and upgrade to API scrapers when found.
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { JobSource } from "../models/jobSource.model.js";
import { INDIA_COMPANY_SOURCES } from "../data/indiaCompanySources.js";
import { resolveCareerBoard } from "../utils/resolveCareerBoard.js";

dotenv.config();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const findSeedCompany = (source) =>
  INDIA_COMPANY_SOURCES.find(
    (company) =>
      company.companyName === source.companyName ||
      company.name === source.name ||
      company.careersUrl === source.url,
  ) || {
    companyName: source.companyName,
    name: source.name,
    careersUrl: source.url,
  };

const run = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI is required");
    process.exit(1);
  }

  console.log("\n=== JobVista source re-probe ===\n");

  await mongoose.connect(mongoUri);

  const sources = await JobSource.find({
    isActive: true,
    scraperType: { $in: ["auto-puppeteer", "unsupported"] },
  }).sort({ companyName: 1 });

  let upgraded = 0;
  let unchanged = 0;
  let failed = 0;

  for (const source of sources) {
    const company = findSeedCompany(source);
    try {
      const resolved = await resolveCareerBoard(company);
      if (!resolved || resolved.scraperType === "auto-puppeteer") {
        unchanged += 1;
        console.log(`• ${source.companyName} — still ${source.scraperType}`);
        continue;
      }

      source.name = resolved.name || source.name;
      source.url = resolved.url;
      source.scraperType = resolved.scraperType;
      source.selectors = resolved.selectors || {};
      source.isActive = resolved.isActive !== false;
      source.lastScrapeError = "";
      await source.save();

      upgraded += 1;
      console.log(`✓ ${source.companyName} → ${resolved.scraperType} (${resolved.url})`);
    } catch (error) {
      failed += 1;
      console.error(`✗ ${source.companyName} — ${error.message}`);
    }

    await delay(800);
  }

  console.log(`\nDone: ${upgraded} upgraded, ${unchanged} unchanged, ${failed} failed\n`);
  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
