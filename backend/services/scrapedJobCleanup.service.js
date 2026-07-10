import { ScrapedJob } from "../models/scrapedJob.model.js";
import { SavedJob } from "../models/savedJob.model.js";
import { TrackedApplication } from "../models/trackedApplication.model.js";
import { MatchScoreCache } from "../models/matchScoreCache.model.js";

export const getScrapedJobKey = (scrapedJobId) => `scraped-${scrapedJobId}`;

export const cascadeDeleteScrapedJobReferences = async (scrapedJobId) => {
  const jobKey = getScrapedJobKey(scrapedJobId);

  const [saved, tracked, scores] = await Promise.all([
    SavedJob.deleteMany({ jobKey }),
    TrackedApplication.deleteMany({ jobKey }),
    MatchScoreCache.deleteMany({ jobKey }),
  ]);

  return {
    savedJobs: saved.deletedCount || 0,
    trackedApplications: tracked.deletedCount || 0,
    matchScores: scores.deletedCount || 0,
  };
};

export const hardDeleteScrapedJob = async (scrapedJobOrId, reason = "unknown") => {
  const job =
    typeof scrapedJobOrId === "object" && scrapedJobOrId?._id
      ? scrapedJobOrId
      : await ScrapedJob.findById(scrapedJobOrId);

  if (!job) return null;

  const cascade = await cascadeDeleteScrapedJobReferences(job._id);
  await ScrapedJob.deleteOne({ _id: job._id });

  console.log(
    `[ScrapedJobCleanup] Deleted ${job._id} "${job.title}" reason=${reason} cascade=${JSON.stringify(cascade)}`,
  );

  return { job, reason, cascade };
};

export const hardDeleteScrapedJobsByQuery = async (query, reason = "unknown") => {
  const jobs = await ScrapedJob.find(query);
  let removedCount = 0;

  for (const job of jobs) {
    const result = await hardDeleteScrapedJob(job, reason);
    if (result) removedCount += 1;
  }

  return removedCount;
};
