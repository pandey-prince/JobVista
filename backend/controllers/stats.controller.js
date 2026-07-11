import { JobSource } from "../models/jobSource.model.js";
import { getScrapedJobsForList } from "../services/job-catalog/index.js";

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

export const getPublicStats = async (req, res) => {
  try {
    const today = startOfToday();
    const visibleJobs = await getScrapedJobsForList("");
    const totalJobs = visibleJobs.length;
    const jobsAddedToday = visibleJobs.filter(
      (job) => job.createdAt && new Date(job.createdAt) >= today,
    ).length;

    const companiesWithJobs = new Set(
      visibleJobs.map((job) => job.company?.name).filter(Boolean),
    ).size;

    const activeSources = await JobSource.find({ isActive: true }).select(
      "lastScrapeStatus lastScrapedAt",
    );
    const companiesMonitored = activeSources.length;
    const sourcesSyncedSuccessfully = activeSources.filter(
      (source) => source.lastScrapeStatus === "success",
    ).length;
    const lastSyncAt = activeSources.reduce((latest, source) => {
      if (!source.lastScrapedAt) return latest;
      if (!latest || source.lastScrapedAt > latest) return source.lastScrapedAt;
      return latest;
    }, null);

    return res.status(200).json({
      success: true,
      stats: {
        totalJobs,
        scrapedJobs: totalJobs,
        companiesMonitored,
        companiesWithJobs,
        sourcesSyncedSuccessfully,
        lastSyncAt: lastSyncAt ? lastSyncAt.toISOString() : null,
        jobsAddedToday,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Stats] getPublicStats failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load stats",
    });
  }
};
