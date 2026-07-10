import { Job } from "../models/job.model.js";
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

    const [
      recruiterJobs,
      scrapedJobs,
      companiesMonitored,
      recruiterJobsToday,
      scrapedJobsToday,
    ] = await Promise.all([
      Job.countDocuments(),
      ScrapedJob.countDocuments({ status: "active" }),
      JobSource.countDocuments({ isActive: true }),
      Job.countDocuments({ createdAt: { $gte: today } }),
      ScrapedJob.countDocuments({
        status: "active",
        firstSeenAt: { $gte: today },
      }),
    ]);

    const totalJobs = recruiterJobs + scrapedJobs;
    const jobsAddedToday = recruiterJobsToday + scrapedJobsToday;

    return res.status(200).json({
      success: true,
      stats: {
        totalJobs,
        recruiterJobs,
        scrapedJobs,
        companiesMonitored,
        jobsAddedToday,
        externalFeeds: ["Remotive", "Arbeitnow"],
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
