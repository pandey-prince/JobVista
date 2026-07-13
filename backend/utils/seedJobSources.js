import { JobSource } from "../models/jobSource.model.js";
import { INDIA_COMPANY_SOURCES } from "../data/indiaCompanySources.js";
import { resolveCareerBoard } from "./resolveCareerBoard.js";

const toPendingSource = (company) => ({
  name: company.name,
  companyName: company.companyName,
  url: company.careersUrl || company.url,
  scraperType: "unsupported",
  isActive: false,
  sourceOrigin: "seed",
  isPublic: true,
  lastScrapeStatus: "never",
  lastScrapeError: "Career page scraper not configured for this company",
});

export const seedIndiaCompanySources = async () => {
  try {
    let added = 0;
    let updated = 0;
    let active = 0;

    for (const company of INDIA_COMPANY_SOURCES) {
      const existing = await JobSource.findOne({ companyName: company.companyName });
      const resolved = (await resolveCareerBoard(company)) || toPendingSource(company);

      if (existing) {
        const needsActivate = Boolean(resolved.isActive) && !existing.isActive;
        const needsConfigUpgrade =
          Boolean(resolved.isActive) &&
          (existing.scraperType === "unsupported" ||
            existing.url !== resolved.url ||
            existing.scraperType !== resolved.scraperType);

        if (needsActivate || needsConfigUpgrade) {
          existing.name = resolved.name || existing.name;
          existing.url = resolved.url;
          existing.scraperType = resolved.scraperType;
          existing.selectors = resolved.selectors || existing.selectors;
          existing.isActive = resolved.isActive;
          existing.lastScrapeError = "";
          await existing.save();
          updated += 1;
        }
        if (existing.isActive) active += 1;
        continue;
      }

      await JobSource.create({
        ...resolved,
        sourceOrigin: "seed",
        isPublic: true,
      });
      added += 1;
      if (resolved.isActive) active += 1;
    }

    console.log(
      `[Seed] India companies: ${INDIA_COMPANY_SOURCES.length} total, ${added} added, ${updated} upgraded, ${active} active scrapers`
    );
  } catch (error) {
    console.error("[Seed] Failed to seed India company sources:", error.message);
  }
};

export const seedDefaultJobSources = seedIndiaCompanySources;
