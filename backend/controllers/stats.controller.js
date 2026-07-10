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

    const companiesMonitored = await JobSource.countDocuments({ isActive: true });

    return res.status(200).json({
      success: true,
      stats: {
        totalJobs,
        scrapedJobs: totalJobs,
        companiesMonitored,
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
