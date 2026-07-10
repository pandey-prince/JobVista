import { ScrapedJob } from "../models/scrapedJob.model.js";
import { JobSource } from "../models/jobSource.model.js";

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

export const getPublicStats = async (req, res) => {
  try {
    const today = startOfToday();

    const [scrapedJobs, companiesMonitored, scrapedJobsToday] = await Promise.all([
      ScrapedJob.countDocuments({ status: "active" }),
      JobSource.countDocuments({ isActive: true }),
      ScrapedJob.countDocuments({
        status: "active",
        firstSeenAt: { $gte: today },
      }),
    ]);

    const totalJobs = scrapedJobs;
    const jobsAddedToday = scrapedJobsToday;

    return res.status(200).json({
      success: true,
      stats: {
        totalJobs,
        scrapedJobs,
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
