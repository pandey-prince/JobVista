import { ScrapedJob } from "../../models/scrapedJob.model.js";
import { filterItJobs } from "../../utils/itJobFilter.js";
import { filterIndiaJobs } from "../../utils/indiaJobFilter.js";
import { cleanJobText, extractExperienceFromTitle } from "../../utils/jobText.js";
import { attachBadgesToJob } from "../../utils/jobBadges.js";

export const mapScrapedJobForList = (job) => {
  const description = cleanJobText(job.description, { maxLength: 400 });

  return attachBadgesToJob(
    {
      _id: `scraped-${job._id}`,
      title: job.title,
      description,
      requirements: job.requirements || [],
      experienceLevel: extractExperienceFromTitle(job.title) || "Not specified",
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
};

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
    .limit(500);

  return filterIndiaJobs(filterItJobs(jobs)).map(mapScrapedJobForList);
};

export const sortJobsByDate = (jobs = []) =>
  [...jobs].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
