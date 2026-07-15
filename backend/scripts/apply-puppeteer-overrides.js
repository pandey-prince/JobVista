/**
 * Apply PUPPETEER_SELECTOR_OVERRIDES onto matching JobSource docs
 * (curated url + selectors). Does not deactivate sources.
 *
 * Usage:
 *   node scripts/apply-puppeteer-overrides.js
 *   node scripts/apply-puppeteer-overrides.js --dry-run
 *   node scripts/apply-puppeteer-overrides.js --smoke=Zensar,Birlasoft,Amazon
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { JobSource } from "../models/jobSource.model.js";
import {
  PUPPETEER_SELECTOR_OVERRIDES,
  getPuppeteerOverride,
} from "../data/puppeteerSelectors.js";
import { runScraper } from "../services/scrapers/index.js";
import { filterIndiaJobs } from "../utils/indiaJobFilter.js";
import { filterItJobs } from "../utils/itJobFilter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.join(__dirname, "..");

for (const envPath of [
  path.join(BACKEND_ROOT, ".env"),
  "C:/Users/princ/Desktop/JobVista/backend/.env",
]) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const dryRun = process.argv.includes("--dry-run");
const smokeArg = process.argv.find((a) => a.startsWith("--smoke="));
const smokeNames = smokeArg
  ? smokeArg
      .slice("--smoke=".length)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : [];

const pickPersistable = (selectors = {}) => {
  const out = {};
  for (const key of [
    "jobList",
    "title",
    "description",
    "location",
    "link",
    "hrefPattern",
    "waitMs",
    "waitUntil",
    "minTitleLength",
    "scroll",
    "nextButton",
    "maxPages",
    "timeoutMs",
  ]) {
    if (selectors[key] !== undefined && selectors[key] !== null && selectors[key] !== "") {
      out[key] = selectors[key];
    }
  }
  return out;
};

const applyOverrides = async () => {
  let updated = 0;
  for (const [companyName, override] of Object.entries(PUPPETEER_SELECTOR_OVERRIDES)) {
    const sources = await JobSource.find({
      companyName: new RegExp(`^${companyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    });
    if (!sources.length) {
      console.log(`skip (no JobSource): ${companyName}`);
      continue;
    }
    for (const source of sources) {
      const nextUrl = override.url || source.url;
      const nextSelectors = {
        ...(source.selectors?.toObject?.() || source.selectors || {}),
        ...pickPersistable(override.selectors || {}),
      };
      let urlChanged = nextUrl && nextUrl !== source.url;
      if (urlChanged) {
        const owner = await JobSource.findOne({
          url: nextUrl,
          _id: { $ne: source._id },
        }).select("_id companyName");
        if (owner) {
          console.log(
            `${companyName}: skip URL (owned by ${owner.companyName}); selectors only`,
          );
          urlChanged = false;
        }
      }
      console.log(
        `${dryRun ? "[dry] " : ""}${companyName}: ${urlChanged ? "URL+selectors" : "selectors"} → ${urlChanged ? nextUrl : source.url}`,
      );
      if (!dryRun) {
        if (urlChanged && nextUrl) source.url = nextUrl;
        source.selectors = nextSelectors;
        if (
          source.scraperType === "auto-puppeteer" ||
          source.scraperType === "puppeteer"
        ) {
          source.scraperType = "auto-puppeteer";
        }
        await source.save();
        updated += 1;
      }
    }
  }
  return updated;
};

const runSmoke = async (names) => {
  for (const name of names) {
    const override = getPuppeteerOverride(name);
    const source =
      (await JobSource.findOne({
        companyName: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
      })) || {
        companyName: name,
        url: override?.url,
        scraperType: "auto-puppeteer",
        selectors: override?.selectors || {},
      };

    if (override?.url) source.url = override.url;
    if (override?.selectors) {
      source.selectors = { ...(source.selectors || {}), ...override.selectors };
    }
    source.scraperType = source.scraperType || "auto-puppeteer";

    console.log(`\n[smoke] ${name} ${source.url}`);
    try {
      const { jobs, usedSelectors } = await runScraper(source);
      const eligible = filterIndiaJobs(filterItJobs(jobs));
      console.log(
        `[smoke] ${name}: raw=${jobs.length} eligible=${eligible.length} selectors=${usedSelectors?.jobList || "(none)"}`,
      );
    } catch (error) {
      console.log(`[smoke] ${name}: FAIL ${error.message}`);
    }
  }
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI missing");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const updated = await applyOverrides();
  console.log(`\nUpdated JobSources: ${updated}${dryRun ? " (dry-run)" : ""}`);

  if (smokeNames.length) {
    await runSmoke(smokeNames);
  }

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
