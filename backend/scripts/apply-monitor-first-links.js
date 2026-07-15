/**
 * Apply monitor_first_100.json URLs by companyName (not URL-only create).
 *
 * Usage:
 *   node scripts/apply-monitor-first-links.js
 *   node scripts/apply-monitor-first-links.js --dry-run
 *   node scripts/apply-monitor-first-links.js --sample-sync=3
 *   node scripts/apply-monitor-first-links.js --skip-mongo
 *
 * Does not push/deploy. Syncs monitoredCompanies.json + known/puppeteer override URLs.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { JobSource } from "../models/jobSource.model.js";
import { resolveScraperConfig } from "../services/careerSource.service.js";
import { syncSourceById, isPuppeteerScraperType } from "../services/scrapeSync.service.js";
import { detectScraperType, runScraper } from "../services/scrapers/index.js";
import { filterIndiaJobs } from "../utils/indiaJobFilter.js";
import { filterItJobs } from "../utils/itJobFilter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.join(__dirname, "..");
const REPO_ROOT = path.join(BACKEND_ROOT, "..");

const envCandidates = [
  path.join(BACKEND_ROOT, ".env"),
  path.join("C:/Users/princ/Desktop/JobVista/backend/.env"),
];
for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const JSON_PATH = path.join(BACKEND_ROOT, "data/lists/monitor_first_100.json");
const CATALOG_PATH = path.join(
  REPO_ROOT,
  "frontend-codes/frontend/src/data/monitoredCompanies.json",
);
const REPORT_PATH = path.join(BACKEND_ROOT, "data/lists/APPLY_MONITOR_LINKS_REPORT.md");
const KNOWN_PATH = path.join(BACKEND_ROOT, "data/knownCareerBoards.js");
const PUPPETEER_PATH = path.join(BACKEND_ROOT, "data/puppeteerSelectors.js");
const INDIA_SOURCES_PATH = path.join(BACKEND_ROOT, "data/indiaCompanySources.js");

const parseArgs = () => {
  const options = { dryRun: false, skipMongo: false, sampleSync: 0 };
  for (const arg of process.argv.slice(2)) {
    if (arg === "--dry-run") options.dryRun = true;
    if (arg === "--skip-mongo") options.skipMongo = true;
    if (arg.startsWith("--sample-sync=")) {
      options.sampleSync = Number(arg.slice("--sample-sync=".length)) || 0;
    }
  }
  return options;
};

const isLinkedInJobsUrl = (url = "") =>
  /linkedin\.com\/company\/.+\/jobs/i.test(url);

const sanitizeUrl = (raw = "") => {
  let url = String(raw || "").trim();
  if (!url) return { url: "", httpsFixed: false };
  let httpsFixed = false;
  if (url.startsWith("http://")) {
    url = `https://${url.slice("http://".length)}`;
    httpsFixed = true;
  }
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
    httpsFixed = true;
  }
  // Keep hash (Ripplehire filters). Drop trailing slash only when no query/hash.
  try {
    const parsed = new URL(url);
    if (!parsed.search && !parsed.hash && parsed.pathname.endsWith("/") && parsed.pathname !== "/") {
      parsed.pathname = parsed.pathname.replace(/\/$/, "");
    }
    url = parsed.toString();
  } catch {
    /* keep as-is */
  }
  return { url, httpsFixed };
};

const pickPrimarySource = (sources = []) => {
  const active = sources.filter((s) => s.isActive);
  const pool = active.length ? active : sources;
  return [...pool].sort(
    (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0),
  )[0];
};

const loadRows = () => {
  const rows = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
  if (!Array.isArray(rows)) throw new Error("monitor_first_100.json must be an array");
  return rows;
};

const upsertMongo = async (rows, { dryRun, sampleSync }) => {
  const results = [];
  const apiSyncCandidates = [];

  for (const row of rows) {
    const companyName = String(row.companyName || "").trim();
    const rawUrl = String(row.careerUrl || "").trim();
    if (!companyName || !rawUrl) {
      results.push({
        companyName: companyName || "(missing)",
        status: "skipped",
        reason: "missing companyName or careerUrl",
      });
      continue;
    }

    if (isLinkedInJobsUrl(rawUrl)) {
      results.push({
        companyName,
        status: "skipped",
        reason: "linkedin_jobs",
        careerUrl: rawUrl,
      });
      continue;
    }

    const { url: nextUrl, httpsFixed } = sanitizeUrl(rawUrl);

    const existingList = await JobSource.find({ companyName });
    const primary = pickPrimarySource(existingList);

    let resolved;
    try {
      resolved = await resolveScraperConfig(nextUrl, undefined, companyName);
    } catch (error) {
      results.push({
        companyName,
        status: "error",
        reason: error.message,
        careerUrl: nextUrl,
      });
      continue;
    }

    const finalUrl = resolved.url || nextUrl;
    const payload = {
      companyName,
      oldUrl: primary?.url || null,
      newUrl: finalUrl,
      scraperType: resolved.scraperType,
      isActive: resolved.isActive,
      httpsFixed,
      created: !primary,
    };

    if (dryRun) {
      results.push({ ...payload, status: "dry_run" });
      if (resolved.isActive && !isPuppeteerScraperType(resolved.scraperType)) {
        apiSyncCandidates.push({ companyName, url: finalUrl, scraperType: resolved.scraperType });
      }
      continue;
    }

    // url has a unique index — never create/update into another company's URL
    const urlOwner = await JobSource.findOne({
      url: finalUrl,
      ...(primary ? { _id: { $ne: primary._id } } : {}),
    });
    if (urlOwner && String(urlOwner.companyName || "").trim() !== companyName) {
      results.push({
        ...payload,
        status: "skipped",
        reason: `url_owned_by_${urlOwner.companyName}`,
        careerUrl: finalUrl,
      });
      continue;
    }

    let source = primary;
    let justCreated = false;
    if (!source) {
      if (urlOwner && String(urlOwner.companyName || "").trim() === companyName) {
        source = urlOwner;
      } else {
        source = await JobSource.create({
          name: `${companyName} Careers`,
          companyName,
          url: finalUrl,
          scraperType: resolved.scraperType,
          selectors: resolved.selectors || {},
          isActive: resolved.isActive,
          isPublic: true,
          sourceOrigin: "json",
          lastScrapeStatus: resolved.isActive ? "pending" : "never",
          lastScrapeError: resolved.isActive
            ? ""
            : "Career page saved. Automatic scraping is not available for this portal yet.",
        });
        justCreated = true;
      }
    }

    payload.created = justCreated;

    if (!justCreated) {
      source.url = finalUrl;
      source.scraperType = resolved.scraperType;
      source.isActive = resolved.isActive;
      if (resolved.selectors) {
        source.selectors = { ...(source.selectors || {}), ...resolved.selectors };
      }
      source.isPublic = true;
      if (!resolved.isActive) {
        source.lastScrapeError =
          "Career page saved. Automatic scraping is not available for this portal yet.";
      } else if (source.lastScrapeError?.includes("not available")) {
        source.lastScrapeError = "";
        source.lastScrapeStatus = "pending";
      }
      await source.save();
    }

    // Deactivate other same-name sources with different URLs
    let deactivated = 0;
    for (const other of existingList) {
      if (String(other._id) === String(source._id)) continue;
      if (other.url === finalUrl) continue;
      if (!other.isActive) continue;
      other.isActive = false;
      other.lastScrapeError = `Deactivated — preferred URL updated for ${companyName}`;
      await other.save();
      deactivated += 1;
    }

    results.push({ ...payload, status: "applied", deactivated, sourceId: String(source._id) });

    if (resolved.isActive && !isPuppeteerScraperType(resolved.scraperType)) {
      apiSyncCandidates.push({
        companyName,
        sourceId: String(source._id),
        url: finalUrl,
        scraperType: resolved.scraperType,
      });
    }
  }

  const syncResults = [];
  if (!dryRun && sampleSync > 0) {
    for (const candidate of apiSyncCandidates.slice(0, sampleSync)) {
      try {
        const result = await syncSourceById(candidate.sourceId);
        syncResults.push({
          companyName: candidate.companyName,
          scraperType: candidate.scraperType,
          success: result.success,
          jobsFound: result.jobsFound,
          error: result.error || "",
        });
      } catch (error) {
        syncResults.push({
          companyName: candidate.companyName,
          scraperType: candidate.scraperType,
          success: false,
          error: error.message,
        });
      }
    }
  }

  return { results, syncResults, apiSyncCandidates };
};

const checkMongoSanity = async (mongoResults) => {
  const appliedNames = (mongoResults || [])
    .filter((r) => r.status === "applied")
    .map((r) => r.companyName);
  if (!appliedNames.length) {
    return { duplicateActivePairs: [], samples: [] };
  }

  const duplicateActivePairs = await JobSource.aggregate([
    { $match: { isActive: true, companyName: { $in: appliedNames } } },
    {
      $group: {
        _id: "$companyName",
        urls: { $addToSet: "$url" },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 }, "urls.1": { $exists: true } } },
    { $limit: 30 },
  ]);

  // Prefer companies that actually changed URL this run
  const sampleNames = [
    "Paytm",
    "PhonePe",
    "BrowserStack",
    "Dell Technologies",
    "Adobe",
    "Cisco",
    "Citrix",
  ].filter((n) => appliedNames.includes(n) || n === "Citrix" || n === "Cisco");

  const samples = await JobSource.find({
    companyName: { $in: sampleNames },
    isActive: true,
  })
    .select("companyName url scraperType isActive")
    .lean();

  return { duplicateActivePairs, samples };
};

const mergeCatalog = (rows) => {
  const existing = fs.existsSync(CATALOG_PATH)
    ? JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"))
    : [];

  const byName = new Map();
  for (const item of existing) {
    const key = String(item.companyName || "").trim().toLowerCase();
    if (!key) continue;
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push(item);
  }

  let updated = 0;
  let added = 0;
  let skippedLinkedIn = 0;

  for (const row of rows) {
    const companyName = String(row.companyName || "").trim();
    const rawUrl = String(row.careerUrl || "").trim();
    if (!companyName || !rawUrl) continue;
    if (isLinkedInJobsUrl(rawUrl)) {
      skippedLinkedIn += 1;
      continue;
    }
    const { url } = sanitizeUrl(rawUrl);
    const key = companyName.toLowerCase();
    const existingRows = byName.get(key) || [];

    if (!existingRows.length) {
      const next = { companyName, url, regions: [] };
      existing.push(next);
      byName.set(key, [next]);
      added += 1;
      continue;
    }

    // Update first row's URL; keep extras (e.g. dual Addverb) if different company pages
    const primary = existingRows[0];
    if (primary.url !== url) {
      primary.url = url;
      updated += 1;
    }
  }

  existing.sort((a, b) =>
    String(a.companyName).localeCompare(String(b.companyName), undefined, {
      sensitivity: "base",
    }),
  );

  fs.writeFileSync(CATALOG_PATH, `${JSON.stringify(existing, null, 2)}\n`, "utf8");
  return {
    catalogTotal: existing.length,
    catalogUpdated: updated,
    catalogAdded: added,
    catalogSkippedLinkedIn: skippedLinkedIn,
    hasNoida: existing.some((e) => (e.regions || []).includes("Noida")),
  };
};

const patchUrlInJsObjectFile = (filePath, companyName, nextUrl) => {
  if (!fs.existsSync(filePath)) return false;
  let text = fs.readFileSync(filePath, "utf8");
  // Match: "Company Name": { ... url: "..." ... }
  const key = companyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blockRe = new RegExp(
    `("${key}"\\s*:\\s*\\{[\\s\\S]*?\\burl\\s*:\\s*")([^"]*)(")`,
    "m",
  );
  if (!blockRe.test(text)) return false;
  text = text.replace(blockRe, `$1${nextUrl}$3`);
  fs.writeFileSync(filePath, text, "utf8");
  return true;
};

const patchIndiaCompanySources = (rows) => {
  if (!fs.existsSync(INDIA_SOURCES_PATH)) return { patched: 0 };
  let text = fs.readFileSync(INDIA_SOURCES_PATH, "utf8");
  let patched = 0;

  for (const row of rows) {
    const companyName = String(row.companyName || "").trim();
    const rawUrl = String(row.careerUrl || "").trim();
    if (!companyName || !rawUrl || isLinkedInJobsUrl(rawUrl)) continue;
    const { url } = sanitizeUrl(rawUrl);
    const nameEsc = companyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Patch careersUrl: "..." inside the object that starts with companyName: "X"
    const careersRe = new RegExp(
      `(companyName:\\s*"${nameEsc}"[\\s\\S]*?careersUrl:\\s*")([^"]*)(")`,
      "m",
    );
    if (careersRe.test(text)) {
      text = text.replace(careersRe, `$1${url}$3`);
      patched += 1;
      continue;
    }

    // Some entries only have url: from spreads — patch explicit url: after companyName when present
    const urlRe = new RegExp(
      `(companyName:\\s*"${nameEsc}"[\\s\\S]*?\\burl:\\s*")([^"]*)(")`,
      "m",
    );
    if (urlRe.test(text)) {
      text = text.replace(urlRe, `$1${url}$3`);
      patched += 1;
    }
  }

  fs.writeFileSync(INDIA_SOURCES_PATH, text, "utf8");
  return { patched };
};

const patchOverrides = (rows) => {
  let known = 0;
  let puppeteer = 0;
  for (const row of rows) {
    const companyName = String(row.companyName || "").trim();
    const rawUrl = String(row.careerUrl || "").trim();
    if (!companyName || !rawUrl || isLinkedInJobsUrl(rawUrl)) continue;
    const { url } = sanitizeUrl(rawUrl);
    if (patchUrlInJsObjectFile(KNOWN_PATH, companyName, url)) known += 1;
    if (patchUrlInJsObjectFile(PUPPETEER_PATH, companyName, url)) puppeteer += 1;
  }
  return { knownPatched: known, puppeteerPatched: puppeteer };
};

const smokeDetectAndScrape = async (rows) => {
  const matrix = [];
  const smoke = [];

  const preferredSmoke = [
    "Paytm",
    "PhonePe",
    "BrowserStack",
    "LinkedIn",
    "CRED",
    "GitLab",
  ];

  for (const row of rows) {
    const companyName = String(row.companyName || "").trim();
    const rawUrl = String(row.careerUrl || "").trim();
    if (!companyName || !rawUrl || isLinkedInJobsUrl(rawUrl)) continue;
    const { url } = sanitizeUrl(rawUrl);
    let scraperType = detectScraperType(url);
    try {
      const resolved = await resolveScraperConfig(url, undefined, companyName);
      scraperType = resolved.scraperType;
      matrix.push({
        companyName,
        url,
        scraperType,
        isActive: resolved.isActive,
      });
    } catch (error) {
      matrix.push({
        companyName,
        url,
        scraperType: "error",
        isActive: false,
        error: error.message,
      });
    }
  }

  for (const name of preferredSmoke) {
    const entry = matrix.find((m) => m.companyName === name && m.isActive);
    if (!entry) continue;
    if (isPuppeteerScraperType(entry.scraperType)) {
      smoke.push({
        companyName: name,
        scraperType: entry.scraperType,
        skipped: true,
        reason: "puppeteer_skipped_in_smoke",
      });
      continue;
    }
    try {
      const { jobs: raw } = await runScraper({
        companyName: name,
        url: entry.url,
        scraperType: entry.scraperType,
        selectors: {},
      });
      const eligible = filterIndiaJobs(filterItJobs(raw));
      smoke.push({
        companyName: name,
        scraperType: entry.scraperType,
        rawCount: raw.length,
        eligibleCount: eligible.length,
        success: true,
      });
    } catch (error) {
      smoke.push({
        companyName: name,
        scraperType: entry.scraperType,
        success: false,
        error: error.message,
      });
    }
  }

  return { matrix, smoke };
};

const writeReport = ({
  options,
  rows,
  mongo,
  catalog,
  seed,
  overrides,
  detect,
}) => {
  const applied = (mongo?.results || []).filter((r) => r.status === "applied");
  const skipped = (mongo?.results || []).filter((r) => r.status === "skipped");
  const errors = (mongo?.results || []).filter((r) => r.status === "error");
  const dry = (mongo?.results || []).filter((r) => r.status === "dry_run");

  const lines = [];
  lines.push("# Apply monitor links — local report");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## Constraints");
  lines.push("- Local apply only — **no git push / deploy** in this run");
  lines.push("- LinkedIn company jobs URLs skipped");
  lines.push("");
  lines.push("## Sanitize / apply stats");
  lines.push(`- JSON rows: **${rows.length}**`);
  lines.push(`- Dry run: **${options.dryRun}**`);
  lines.push(`- Skip mongo: **${options.skipMongo}**`);
  if (mongo) {
    lines.push(`- Applied: **${applied.length}**`);
    lines.push(`- Dry-run planned: **${dry.length}**`);
    lines.push(`- Skipped: **${skipped.length}**`);
    lines.push(`- Errors: **${errors.length}**`);
    lines.push(
      `- HTTPS upgrades: **${(mongo.results || []).filter((r) => r.httpsFixed).length}**`,
    );
  }
  lines.push("");
  lines.push("### Skipped LinkedIn");
  for (const row of skipped.filter((r) => r.reason === "linkedin_jobs")) {
    lines.push(`- ${row.companyName}: \`${row.careerUrl}\``);
  }
  const otherSkipped = skipped.filter((r) => r.reason !== "linkedin_jobs");
  if (otherSkipped.length) {
    lines.push("");
    lines.push("### Other Mongo skips");
    for (const row of otherSkipped) {
      lines.push(
        `- ${row.companyName}: ${row.reason}${row.careerUrl ? ` (\`${row.careerUrl}\`)` : ""}`,
      );
    }
  }
  lines.push("");
  lines.push("## Catalog `/companies`");
  if (catalog) {
    lines.push(`- Total entries: **${catalog.catalogTotal}**`);
    lines.push(`- Updated URLs: **${catalog.catalogUpdated}**`);
    lines.push(`- Added companies: **${catalog.catalogAdded}**`);
    lines.push(`- Still has Noida regions: **${catalog.hasNoida}**`);
  }
  lines.push("");
  lines.push("## Seed / overrides");
  lines.push(`- indiaCompanySources careersUrl patches: **${seed?.patched ?? 0}**`);
  lines.push(`- knownCareerBoards url patches: **${overrides?.knownPatched ?? 0}**`);
  lines.push(`- puppeteerSelectors url patches: **${overrides?.puppeteerPatched ?? 0}**`);
  lines.push("");
  lines.push("## Scraper detection matrix");
  lines.push("");
  lines.push("| Company | Scraper | Active |");
  lines.push("|---|---|---|");
  for (const row of detect?.matrix || []) {
    lines.push(
      `| ${row.companyName} | ${row.scraperType} | ${row.isActive}${row.error ? ` (${row.error})` : ""} |`,
    );
  }
  lines.push("");
  lines.push("## Smoke scrapes (API boards)");
  lines.push("");
  for (const row of detect?.smoke || []) {
    if (row.skipped) {
      lines.push(`- **${row.companyName}**: skipped (${row.reason})`);
    } else if (row.success) {
      lines.push(
        `- **${row.companyName}** [${row.scraperType}]: raw=${row.rawCount}, eligible IT+India=${row.eligibleCount}`,
      );
    } else {
      lines.push(`- **${row.companyName}** [${row.scraperType}]: FAIL — ${row.error}`);
    }
  }
  if (mongo?.syncResults?.length) {
    lines.push("");
    lines.push("## Sample Mongo sync");
    for (const row of mongo.syncResults) {
      lines.push(
        `- **${row.companyName}**: success=${row.success} jobsFound=${row.jobsFound ?? "n/a"} ${row.error || ""}`,
      );
    }
  }
  if (mongo?.sanity) {
    lines.push("");
    lines.push("## Mongo sanity");
    const dups = mongo.sanity.duplicateActivePairs || [];
    lines.push(
      `- Active same-company sources with multiple URLs among applied set: **${dups.length}**`,
    );
    for (const d of dups.slice(0, 10)) {
      lines.push(`  - ${d._id}: ${d.count} sources — ${(d.urls || []).join(" | ")}`);
    }
    lines.push("- Sample active docs after apply:");
    for (const s of mongo.sanity.samples || []) {
      lines.push(
        `  - **${s.companyName}**: \`${s.url}\` (${s.scraperType}, active=${s.isActive})`,
      );
    }
  }
  lines.push("");
  lines.push("## Known risks");
  lines.push("- LTIMindtree / Mphasis Ripplehire token URLs may expire");
  lines.push("- Infosys URL is no longer digitalcareers SmartDreamers — likely auto-puppeteer");
  lines.push("- Flipkart Turbohire / Adobe search-results / Cisco search may need better selectors");
  lines.push("- Citrix currently uses the same Cisco careers URL");
  lines.push("- Chargebee & Oyo LinkedIn URLs were not applied");
  lines.push("");
  lines.push("## Deploy");
  lines.push("Not deployed. Say **deploy** when you want push to production.");
  lines.push("");

  fs.writeFileSync(REPORT_PATH, lines.join("\n"), "utf8");
  return REPORT_PATH;
};

const run = async () => {
  const options = parseArgs();
  const rows = loadRows();
  console.log(`Loaded ${rows.length} rows from monitor_first_100.json`);

  const catalog = mergeCatalog(rows);
  console.log("Catalog merge:", catalog);

  const seed = patchIndiaCompanySources(rows);
  console.log("Seed patch:", seed);

  const overrides = patchOverrides(rows);
  console.log("Overrides patch:", overrides);

  let mongo = null;
  if (!options.skipMongo) {
    if (!process.env.MONGO_URI) {
      console.error("MONGO_URI missing — run with --skip-mongo or set .env");
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to Mongo");
    mongo = await upsertMongo(rows, options);
    mongo.sanity = await checkMongoSanity(mongo.results);
    console.log(
      `Mongo results: applied=${mongo.results.filter((r) => r.status === "applied").length} skipped=${mongo.results.filter((r) => r.status === "skipped").length} errors=${mongo.results.filter((r) => r.status === "error").length}`,
    );
  }

  const detect = await smokeDetectAndScrape(rows);
  const reportPath = writeReport({
    options,
    rows,
    mongo,
    catalog,
    seed,
    overrides,
    detect,
  });
  console.log(`Report written: ${reportPath}`);

  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
};

run().catch(async (error) => {
  console.error("apply-monitor-first-links failed:", error);
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect().catch(() => {});
  }
  process.exit(1);
});
