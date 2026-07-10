import { filterItJobs } from "../../utils/itJobFilter.js";
import { attachBadgesToJob } from "../../utils/jobBadges.js";

const stripHtml = (value = "") =>
  value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

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

export const mapRemotiveJob = (job) =>
  attachBadgesToJob(
    {
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
    },
    { sourceType: "remotive", sourceLabel: "Remotive" },
  );

export const mapArbeitnowJob = (job) =>
  attachBadgesToJob(
    {
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
    },
    { sourceType: "arbeitnow", sourceLabel: "Arbeitnow" },
  );

const REMOTIVE_IT_CATEGORIES = ["software-dev", "devops-sysadmin", "data", "qa"];

const fetchRemotiveJobs = async (keyword = "") => {
  try {
    const requests = REMOTIVE_IT_CATEGORIES.map(async (category) => {
      const url = new URL("https://remotive.com/api/remote-jobs");
      url.searchParams.set("category", category);
      if (keyword) url.searchParams.set("search", keyword);

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
  } catch {
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
          data.data.filter(isDemoFriendlyJob).filter((job) => matchesExternalKeyword(job, query)),
        )
          .slice(0, 8)
          .map(mapArbeitnowJob)
      : [];
  } catch {
    return [];
  }
};

export const fetchExternalJobs = async (keyword = "") => {
  const [remotiveJobs, arbeitnowJobs] = await Promise.all([
    fetchRemotiveJobs(keyword),
    fetchArbeitnowJobs(keyword),
  ]);
  return [...remotiveJobs, ...arbeitnowJobs].slice(0, 14);
};

export const fetchExternalJobById = async (jobId) => {
  if (jobId.startsWith("remotive-")) {
    const remoteId = jobId.replace("remotive-", "");
    try {
      const response = await fetch("https://remotive.com/api/remote-jobs");
      if (!response.ok) return null;
      const data = await response.json();
      const job = (data.jobs || []).find((item) => String(item.id) === remoteId);
      return job ? mapRemotiveJob(job) : null;
    } catch {
      return null;
    }
  }

  if (jobId.startsWith("arbeitnow-")) {
    const slug = jobId.replace("arbeitnow-", "");
    try {
      const response = await fetch("https://arbeitnow.com/api/job-board-api");
      if (!response.ok) return null;
      const data = await response.json();
      const job = (data.data || []).find((item) => item.slug === slug);
      return job ? mapArbeitnowJob(job) : null;
    } catch {
      return null;
    }
  }

  return null;
};

export const isExternalJobId = (jobId = "") =>
  jobId.startsWith("remotive-") || jobId.startsWith("arbeitnow-");
