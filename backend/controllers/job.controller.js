import { Job } from "../models/job.model.js";
import { getScrapedJobsForList } from "./scrapedJob.controller.js";
import { filterItJobs } from "../utils/itJobFilter.js";

const stripHtml = (value = "") => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const blockedExternalTerms = [
  "adult",
  "nsfw",
  "casino",
  "gambling",
  "dating",
  "crypto",
  "betting",
];

const isDemoFriendlyJob = (job) => {
  const text = [
    job.title,
    job.company_name,
    job.companyName,
    job.category,
    job.description,
    ...(job.tags || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return !blockedExternalTerms.some((term) => text.includes(term));
};

const matchesExternalKeyword = (job, keyword = "") => {
  if (!keyword) return true;
  const query = keyword.toLowerCase();
  return [
    job.title,
    job.company_name,
    job.companyName,
    job.category,
    job.location,
    job.candidate_required_location,
    ...(job.tags || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(query);
};

const mapRemotiveJob = (job) => ({
  _id: `remotive-${job.id}`,
  title: job.title,
  description: stripHtml(job.description).slice(0, 260),
  requirements: job.tags || [],
  experienceLevel: job.category || "Remote",
  salary: job.salary && job.salary !== "-" ? job.salary : "Not disclosed",
  location: job.candidate_required_location || "Remote / Worldwide",
  jobType: job.job_type?.replace("_", " ") || "Remote",
  position: 1,
  company: {
    name: job.company_name || "Remote Company",
    logo: job.company_logo || "",
  },
  createdAt: job.publication_date
    ? new Date(job.publication_date).toISOString()
    : new Date().toISOString(),
  applications: [],
  external: true,
  externalSource: "Remotive",
  applicationLink: job.url,
});

const mapArbeitnowJob = (job) => ({
  _id: `arbeitnow-${job.slug}`,
  title: job.title,
  description: stripHtml(job.description).slice(0, 260),
  requirements: job.tags || [],
  experienceLevel: job.job_types?.join(", ") || "Open",
  salary: "Not disclosed",
  location: job.remote ? "Remote" : job.location || "Europe",
  jobType: job.job_types?.[0] || (job.remote ? "Remote" : "On-site"),
  position: 1,
  company: {
    name: job.company_name || "Hiring Company",
    logo: "",
  },
  createdAt: job.created_at
    ? new Date(job.created_at * 1000).toISOString()
    : new Date().toISOString(),
  applications: [],
  external: true,
  externalSource: "Arbeitnow",
  applicationLink: job.url,
});

const REMOTIVE_IT_CATEGORIES = [
  "software-dev",
  "devops-sysadmin",
  "data",
  "qa",
];

const fetchRemotiveJobs = async (keyword = "") => {
  try {
    const requests = REMOTIVE_IT_CATEGORIES.map(async (category) => {
      const url = new URL("https://remotive.com/api/remote-jobs");
      url.searchParams.set("category", category);
      if (keyword) {
        url.searchParams.set("search", keyword);
      }

      const response = await fetch(url);
      if (!response.ok) return [];

      const data = await response.json();
      return Array.isArray(data.jobs) ? data.jobs : [];
    });

    const results = await Promise.all(requests);
    const uniqueJobs = new Map();

    results.flat().forEach((job) => {
      if (isDemoFriendlyJob(job) && matchesExternalKeyword(job, keyword)) {
        uniqueJobs.set(job.id, job);
      }
    });

    return filterItJobs([...uniqueJobs.values()])
      .slice(0, 10)
      .map(mapRemotiveJob);
  } catch (error) {
    return [];
  }
};

const fetchArbeitnowJobs = async (keyword = "") => {
  try {
    const response = await fetch("https://arbeitnow.com/api/job-board-api");
    if (!response.ok) return [];

    const data = await response.json();
    const query = keyword.toLowerCase();
    return Array.isArray(data.data)
      ? filterItJobs(
          data.data.filter(isDemoFriendlyJob).filter((job) => matchesExternalKeyword(job, query))
        )
          .slice(0, 8)
          .map(mapArbeitnowJob)
      : [];
  } catch (error) {
    return [];
  }
};

const fetchExternalJobs = async (keyword = "") => {
  const [remotiveJobs, arbeitnowJobs] = await Promise.all([
    fetchRemotiveJobs(keyword),
    fetchArbeitnowJobs(keyword),
  ]);

  return [...remotiveJobs, ...arbeitnowJobs].slice(0, 14);
};

const sortJobsByDate = (jobs = []) =>
  [...jobs].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

export const postJob = async (req, res) => {
  try {
    const {
      title,
      description,
      requirements,
      salary,
      location,
      jobType,
      experience,
      position,
      companyId,
    } = req.body;

    const userId = req.id;

    if (
      !title ||
      !description ||
      !requirements ||
      !salary ||
      !location ||
      !position ||
      !jobType ||
      !companyId ||
      !experience
    ) {
      res.status(400).json({
        message: "Something is missing",
        success: false,
      });
    }

    const job = await Job.create({
      title,
      description,
      requirements: requirements.split(","),
      salary: Number(salary),
      location,
      jobType,
      position,
      experienceLevel: experience,
      company: companyId,
      created_by: userId,
    });

    res.status(201).json({
      message: "New job created Successfully",
      success: true,
      job,
    });
  } catch (err) {
    console.log(err);
  }
};

export const getAllJobs = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    const includeExternal = req.query.includeExternal !== "false";

    const jobs = await Job.find({
      $or: [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
        { location: { $regex: keyword, $options: "i" } },
      ],
    }).populate("company");

    if (!jobs) {
      return res.status(404).json({
        message: "job not found",
        success: false,
      });
    }

    const itJobs = filterItJobs(jobs);
    const externalJobs = includeExternal ? await fetchExternalJobs(keyword) : [];
    const scrapedJobs = includeExternal ? await getScrapedJobsForList(keyword) : [];
    const mergedJobs = sortJobsByDate([...itJobs, ...scrapedJobs, ...externalJobs]);

    res.status(200).json({
      jobs: mergedJobs,
      success: true,
    });
  } catch (err) {
    console.log(err);
  }
};

//student

export const getJobById = async (req, res) => {
  try {
    const jobId = req.params.id;
    if (jobId.startsWith("remotive-") || jobId.startsWith("arbeitnow-")) {
      return res.status(404).json({
        message: "External jobs open on the source website",
        success: false,
      });
    }

    const job = await Job.findById(jobId).populate("company");
    if (!job || !filterItJobs([job]).length) {
      return res.status(404).json({
        message: "Job not found",
        success: false,
      });
    }
    res.status(200).json({
      job,
      success: true,
    });
  } catch (err) {
    console.log(err);
  }
};

export const getAdminJobs = async (req, res) => {
  try {
    const adminId = req.id;
    const jobs = await Job.find({ created_by: adminId }).populate("company").sort({ createdAt: -1 });
    if (!jobs) {
      res.status(404).json({
        message: "Job not found",
        success: false,
      });
    }
    res.status(200).json({
      jobs,
      success: true,
    });
  } catch (err) {
    console.log(err);
  }
};
