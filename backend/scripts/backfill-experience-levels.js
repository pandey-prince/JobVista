/**
 * One-shot: resolve and persist experienceLevel on active ScrapedJobs.
 *
 * Usage:
 *   node scripts/backfill-experience-levels.js
 *   node scripts/backfill-experience-levels.js --dry-run
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { ScrapedJob } from "../models/scrapedJob.model.js";
import { resolveExperienceLevel } from "../utils/jobText.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.join(__dirname, "..");

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

const BATCH_SIZE = 200;

const parseArgs = () => ({
  dryRun: process.argv.includes("--dry-run"),
});

const run = async () => {
  const { dryRun } = parseArgs();
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI missing");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected${dryRun ? " (dry-run)" : ""}`);

  const total = await ScrapedJob.countDocuments({ status: "active" });
  console.log(`Active jobs: ${total}`);

  let scanned = 0;
  let updated = 0;
  let unchanged = 0;
  let stillUnknown = 0;
  const unknownSamples = [];

  let lastId = null;
  for (;;) {
    const query = { status: "active" };
    if (lastId) query._id = { $gt: lastId };

    const batch = await ScrapedJob.find(query)
      .sort({ _id: 1 })
      .limit(BATCH_SIZE)
      .select("title description requirements experienceLevel companyName");

    if (!batch.length) break;

    for (const job of batch) {
      scanned += 1;
      const resolved = resolveExperienceLevel(job);
      const current = String(job.experienceLevel || "").trim();

      if (!resolved) {
        stillUnknown += 1;
        unchanged += 1;
        if (unknownSamples.length < 12) {
          unknownSamples.push({
            company: job.companyName,
            title: job.title,
            current: current || "(empty)",
          });
        }
        continue;
      }

      if (current === resolved) {
        unchanged += 1;
        continue;
      }

      if (!dryRun) {
        job.experienceLevel = resolved;
        await job.save();
      }
      updated += 1;
    }

    lastId = batch[batch.length - 1]._id;
    console.log(`Progress: scanned=${scanned}/${total} updated=${updated}`);
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        scanned,
        updated,
        unchanged,
        stillUnknown,
        unknownSamples,
      },
      null,
      2,
    ),
  );

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
