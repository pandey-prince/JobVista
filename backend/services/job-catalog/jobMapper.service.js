import { ScrapedJob } from "../../models/scrapedJob.model.js";
import { filterItJobs } from "../../utils/itJobFilter.js";
import { filterIndiaJobs } from "../../utils/indiaJobFilter.js";
import { attachBadgesToJob } from "../../utils/jobBadges.js";

export const mapScrapedJobForList = (job) =>
  attachBadgesToJob(
    {
      _id: `scraped-${job._id}`,
      title: job.title,
      description: job.description.slice(0, 260),
      requirements: job.requirements || [],
      experienceLevel: job.jobType || "Open",
      salary: job.salary || "Not disclosed",
      location: job.location,
      jobType: job.jobType,
      position: 1,
      company: {
        name: job.companyName,
        logo: job.companyLogo || "",
      },
      createdAt: job.firstSeenAt,
      applications: [],
      external: true,
      externalSource: job.source?.name || job.companyName,
      applicationLink: job.applicationUrl,
      scrapedJobId: job._id,
    },
    {
      sourceType: "career_page",
      sourceLabel: job.source?.name || job.companyName,
    },
  );

export const getScrapedJobsForList = async (keyword = "") => {
  const query = { status: "active" };

  if (keyword) {
    const regex = { $regex: keyword, $options: "i" };
    query.$or = [
      { title: regex },
      { description: regex },
      { location: regex },
      { companyName: regex },
    ];
  }

  const jobs = await ScrapedJob.find(query)
    .populate("source")
    .sort({ firstSeenAt: -1 })
    .limit(200);

  return filterIndiaJobs(filterItJobs(jobs)).slice(0, 150).map(mapScrapedJobForList);
};

export const sortJobsByDate = (jobs = []) =>
  [...jobs].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
