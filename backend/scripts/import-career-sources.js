/**
 * Import career sources from Excel/CSV/JSON.
 * Usage: node scripts/import-career-sources.js --file=data/lists/noida_company_careers.json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { createOrGetJobSource } from "../services/careerSource.service.js";
import {
  parseCareerSourcesJson,
  titleCaseRegion,
} from "../utils/parseCareerSourcesInput.js";
import { parseCareerSourcesSpreadsheet } from "../utils/parseCareerSourcesSpreadsheet.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    file: path.join(__dirname, "../data/lists/noida_company_careers.json"),
    region: "",
  };

  for (const arg of args) {
    if (arg.startsWith("--file=")) options.file = arg.slice("--file=".length);
    if (arg.startsWith("--region=")) options.region = arg.slice("--region=".length);
  }

  return options;
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is required");
    process.exit(1);
  }

  const options = parseArgs();
  const absolute = path.isAbsolute(options.file)
    ? options.file
    : path.resolve(process.cwd(), options.file);

  if (!fs.existsSync(absolute)) {
    console.error(`File not found: ${absolute}`);
    process.exit(1);
  }

  const buffer = fs.readFileSync(absolute);
  const lower = absolute.toLowerCase();
  let region = titleCaseRegion(options.region);
  let companies = [];

  if (lower.endsWith(".json")) {
    const parsed = parseCareerSourcesJson(buffer, region);
    region = parsed.region || region;
    companies = parsed.companies;
  } else {
    companies = parseCareerSourcesSpreadsheet(buffer);
  }

  console.log(
    `\n=== Import career sources ===\nFile: ${absolute}\nRegion: ${region || "(none)"}\nRows: ${companies.length}\n`,
  );

  await mongoose.connect(process.env.MONGO_URI);

  const results = [];
  for (const row of companies) {
    try {
      const rowRegion = row.region || region;
      const { source, created } = await createOrGetJobSource({
        url: row.careerUrl,
        companyName: row.companyName,
        name: row.name,
        scraperType: row.scraperType || undefined,
        sourceOrigin: lower.endsWith(".json") ? "json" : "excel",
        isPublic: true,
        triggerSync: false,
        regions: rowRegion ? [rowRegion] : [],
      });
      results.push({
        companyName: row.companyName,
        success: true,
        created,
        isActive: source.isActive,
        scraperType: source.scraperType,
        regions: source.regions || [],
      });
      console.log(
        `${created ? "CREATED" : "EXISTING"} ${row.companyName} [${source.scraperType}] active=${source.isActive}`,
      );
    } catch (error) {
      results.push({
        companyName: row.companyName,
        success: false,
        error: error.message,
      });
      console.error(`FAILED ${row.companyName}: ${error.message}`);
    }
  }

  const summary = {
    total: results.length,
    created: results.filter((r) => r.success && r.created).length,
    existing: results.filter((r) => r.success && !r.created).length,
    failed: results.filter((r) => !r.success).length,
    active: results.filter((r) => r.success && r.isActive).length,
  };

  console.log("\nSummary:", JSON.stringify(summary, null, 2));
  await mongoose.disconnect();
  process.exit(summary.failed === summary.total ? 1 : 0);
};

run().catch(async (error) => {
  console.error("import-career-sources failed:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
