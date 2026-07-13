import { ScrapedJob } from "../../models/scrapedJob.model.js";
import { filterItJobs } from "../../utils/itJobFilter.js";
import { filterIndiaJobs } from "../../utils/indiaJobFilter.js";
import { cleanJobText, extractExperienceFromTitle } from "../../utils/jobText.js";
import { attachBadgesToJob } from "../../utils/jobBadges.js";
import { toPublicApplicationUrl } from "../../utils/applicationUrl.js";

const normalizeDedupeText = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\/$/, "");

const normalizeComparableText = (value = "") =>
  String(value).toLowerCase().trim().replace(/\s+/g, " ");

export const mapScrapedJobForList = (job) => {
  let description = cleanJobText(job.description, { maxLength: 400 });
  const locationNorm = normalizeComparableText(job.location);
  if (
    description &&
    (normalizeComparableText(description) === locationNorm ||
      normalizeComparableText(description) === normalizeComparableText(job.title))
  ) {
    description = "";
  }

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
      applicationLink: toPublicApplicationUrl(job.applicationUrl),
      scrapedJobId: job._id,
    },
    {
      sourceType: "career_page",
      sourceLabel: job.source?.name || job.companyName,
    },
  );
};

const dedupeScrapedJobs = (jobs = []) => {
  const sorted = [...jobs].sort(
    (a, b) => new Date(b.firstSeenAt || 0) - new Date(a.firstSeenAt || 0),
  );
  const seenCompanyTitle = new Set();
  const seenUrls = new Set();
  const deduped = [];

  for (const job of sorted) {
    const companyTitleKey = `${normalizeDedupeText(job.companyName)}::${normalizeDedupeText(job.title)}`;
    const urlKey = normalizeDedupeText(job.applicationUrl);

    if (seenCompanyTitle.has(companyTitleKey) || (urlKey && seenUrls.has(urlKey))) {
      continue;
    }

    seenCompanyTitle.add(companyTitleKey);
    if (urlKey) seenUrls.add(urlKey);
    deduped.push(job);
  }

  return deduped;
};

export { dedupeScrapedJobs };

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

  return dedupeScrapedJobs(filterIndiaJobs(filterItJobs(jobs))).map(mapScrapedJobForList);
};

export const sortJobsByDate = (jobs = []) =>
  [...jobs].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
