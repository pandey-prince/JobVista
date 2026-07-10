import { Job } from "../models/job.model.js";
import {
  fetchExternalJobById,
  getScrapedJobsForList,
  isExternalJobId,
  sortJobsByDate,
} from "../services/job-catalog/index.js";
import { filterItJobs } from "../utils/itJobFilter.js";
import { filterIndiaJobs } from "../utils/indiaJobFilter.js";
import { parseJobListFilters, filterJobList } from "../utils/jobListFilters.js";
import {
  parsePagination,
  paginateArray,
} from "../utils/pagination.js";
import { attachBadgesToJob } from "../utils/jobBadges.js";

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
      return res.status(400).json({
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

    return res.status(201).json({
      message: "New job created Successfully",
      success: true,
      job,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Unable to create job",
      success: false,
    });
  }
};

export const getAllJobs = async (req, res) => {
  try {
    const keyword = String(req.query.keyword || "").trim();
    const filters = parseJobListFilters(req.query);
    const paginationQuery = parsePagination(req.query, {
      defaultLimit: 12,
      maxLimit: 48,
    });

    const recruiterQuery = keyword
      ? {
          $or: [
            { title: { $regex: escapeRegex(keyword), $options: "i" } },
            { description: { $regex: escapeRegex(keyword), $options: "i" } },
            { location: { $regex: escapeRegex(keyword), $options: "i" } },
          ],
        }
      : {};

    const jobs = await Job.find(recruiterQuery).populate("company");

    const itJobs = filterIndiaJobs(
      filterItJobs(jobs).map((job) =>
        attachBadgesToJob(job, {
          sourceType: "recruiter",
          sourceLabel: "JobVista",
        }),
      ),
    );
    const scrapedJobs = await getScrapedJobsForList(keyword);
    const mergedJobs = sortJobsByDate([...itJobs, ...scrapedJobs]);
    const filteredJobs = filterJobList(mergedJobs, keyword, filters);
    const { data: jobsPage, pagination } = paginateArray(filteredJobs, paginationQuery);

    res.status(200).json({
      jobs: jobsPage,
      pagination,
      success: true,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Unable to fetch jobs",
      success: false,
    });
  }
};

export const getJobById = async (req, res) => {
  try {
    const jobId = req.params.id;

    if (isExternalJobId(jobId)) {
      const externalJob = await fetchExternalJobById(jobId);
      if (!externalJob) {
        return res.status(404).json({
          message: "External job not found",
          success: false,
        });
      }

      return res.status(200).json({
        job: externalJob,
        success: true,
      });
    }

    const job = await Job.findById(jobId).populate("company");
    if (!job || !filterItJobs([job]).length) {
      return res.status(404).json({
        message: "Job not found",
        success: false,
      });
    }
    return res.status(200).json({
      job: attachBadgesToJob(job, {
        sourceType: "recruiter",
        sourceLabel: "JobVista",
      }),
      success: true,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Unable to fetch job",
      success: false,
    });
  }
};

export const getAdminJobs = async (req, res) => {
  try {
    const adminId = req.id;
    const jobs = await Job.find({ created_by: adminId }).populate("company").sort({ createdAt: -1 });
    return res.status(200).json({
      jobs: jobs || [],
      success: true,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Unable to fetch recruiter jobs",
      success: false,
    });
  }
};
