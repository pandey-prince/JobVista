/**
 * Re-probe auto-puppeteer sources: upgrade to API scrapers or refresh URL/selectors.
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { JobSource } from "../models/jobSource.model.js";
import { INDIA_COMPANY_SOURCES } from "../data/indiaCompanySources.js";
import { KNOWN_CAREER_BOARDS } from "../data/knownCareerBoards.js";
import { resolveCareerBoard } from "../utils/resolveCareerBoard.js";
import { getPuppeteerOverride } from "../data/puppeteerSelectors.js";
import { isPuppeteerScraperType } from "../services/scrapeSync.service.js";

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

const applyResolved = (source, resolved) => {
  const nextActive = resolved.isActive !== false;
  const urlChanged = resolved.url && resolved.url !== source.url;
  const typeChanged =
    resolved.scraperType && resolved.scraperType !== source.scraperType;
  const selectorsChanged =
    JSON.stringify(resolved.selectors || {}) !==
    JSON.stringify(source.selectors || {});
  const activeChanged = nextActive !== source.isActive;

  if (!urlChanged && !typeChanged && !selectorsChanged && !activeChanged) {
    return false;
  }

  if (resolved.url) source.url = resolved.url;
  if (resolved.scraperType) source.scraperType = resolved.scraperType;
  source.selectors = resolved.selectors || {};
  source.isActive = nextActive;
  if (nextActive) {
    source.lastScrapeError = "";
  }
  return true;
};

const deactivateFromKnownBoards = async () => {
  let deactivated = 0;

  for (const [companyName, known] of Object.entries(KNOWN_CAREER_BOARDS)) {
    if (known.isActive !== false) continue;

    const source = await JobSource.findOne({ companyName });
    if (!source || !source.isActive) continue;

    if (
      applyResolved(source, {
        url: known.url,
        scraperType: known.scraperType,
        selectors: known.selectors || {},
        isActive: false,
      })
    ) {
      await source.save();
      deactivated += 1;
      console.log(`⊘ ${companyName} — deactivated (known board inactive)`);
    }
  }

  return deactivated;
};

const refreshApiSourceConfigs = async () => {
  let refreshed = 0;

  for (const [companyName, known] of Object.entries(KNOWN_CAREER_BOARDS)) {
    if (known.isActive === false) continue;
    if (isPuppeteerScraperType(known.scraperType)) continue;

    const source = await JobSource.findOne({ companyName });
    if (!source) continue;

    if (
      applyResolved(source, {
        url: known.url,
        scraperType: known.scraperType,
        selectors: known.selectors || {},
        isActive: true,
      })
    ) {
      await source.save();
      refreshed += 1;
      console.log(`↻ ${companyName} — API config refreshed`);
    }
  }

  return refreshed;
};

const run = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI is required");
    process.exit(1);
  }

  console.log("\n=== JobVista source re-probe ===\n");

  await mongoose.connect(mongoUri);

  const knownDeactivated = await deactivateFromKnownBoards();
  const apiRefreshed = await refreshApiSourceConfigs();

  const sources = await JobSource.find({
    isActive: true,
    scraperType: { $in: ["auto-puppeteer", "unsupported"] },
  }).sort({ companyName: 1 });

  let upgraded = 0;
  let patched = 0;
  let deactivated = 0;
  let unchanged = 0;
  let failed = 0;

  for (const source of sources) {
    const company = findSeedCompany(source);
    try {
      const resolved = await resolveCareerBoard(company);
      if (!resolved) {
        unchanged += 1;
        console.log(`• ${source.companyName} — no resolution`);
        continue;
      }

      if (resolved.isActive === false) {
        if (applyResolved(source, resolved)) {
          await source.save();
          deactivated += 1;
          console.log(`⊘ ${source.companyName} — deactivated`);
        } else {
          unchanged += 1;
        }
        continue;
      }

      if (resolved.scraperType !== "auto-puppeteer") {
        if (applyResolved(source, resolved)) {
          await source.save();
          upgraded += 1;
          console.log(
            `✓ ${source.companyName} → ${resolved.scraperType} (${resolved.url})`,
          );
        } else {
          unchanged += 1;
        }
        continue;
      }

      const override = getPuppeteerOverride(source.companyName);
      const patch = {
        ...resolved,
        url: override?.url || resolved.url,
        selectors: {
          ...(resolved.selectors || {}),
          ...(override?.selectors || {}),
        },
      };

      if (applyResolved(source, patch)) {
        await source.save();
        patched += 1;
        console.log(`↻ ${source.companyName} — puppeteer URL/selectors updated`);
      } else {
        unchanged += 1;
        console.log(`• ${source.companyName} — still auto-puppeteer`);
      }
    } catch (error) {
      failed += 1;
      console.error(`✗ ${source.companyName} — ${error.message}`);
    }

    await delay(800);
  }

  console.log(
    `\nDone: ${knownDeactivated} known deactivated, ${apiRefreshed} API refreshed, ${upgraded} upgraded to API, ${patched} puppeteer patches, ${deactivated} deactivated, ${unchanged} unchanged, ${failed} failed\n`,
  );
  await mongoose.disconnect();
  // Soft-fail: individual company probe failures should not red the workflow.
  process.exit(0);
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
