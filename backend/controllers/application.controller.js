import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { getOwnedApplication, getOwnedJob } from "../utils/jobOwnership.js";

const isInternalJobId = (jobId = "") =>
  !jobId.startsWith("scraped-") &&
  !jobId.startsWith("remotive-") &&
  !jobId.startsWith("arbeitnow-");

export const applyJob = async (req, res) => {
  try {
    const userId = req.id;
    const jobId = req.params.id;

    if (!jobId) {
      return res.status(400).json({
        message: "Job id is required",
        success: false,
      });
    }

    if (!isInternalJobId(jobId)) {
      return res.status(400).json({
        message: "External jobs must be applied on the company website",
        success: false,
      });
    }

    const existingApplication = await Application.findOne({
      job: jobId,
      applicant: userId,
    });

    if (existingApplication) {
      return res.status(400).json({
        message: "You have already applied for this job",
        success: false,
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        success: false,
      });
    }

    const newApplication = await Application.create({
      job: jobId,
      applicant: userId,
    });

    job.applications.push(newApplication._id);
    await job.save();

    return res.status(201).json({
      message: "Job applied successfully",
      success: true,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Unable to apply for this job",
      success: false,
    });
  }
};

export const getAppliedJobs = async (req, res) => {
  try {
    const userId = req.id;
    const application = await Application.find({ applicant: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: "job",
        options: { sort: { createdAt: -1 } },
        populate: { path: "company", options: { sort: { createdAt: -1 } } },
      });

    if (!application?.length) {
      return res.status(200).json({
        application: [],
        success: true,
      });
    }

    return res.status(200).json({
      application,
      success: true,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Unable to fetch applications",
      success: false,
    });
  }
};

export const getApplicants = async (req, res) => {
  try {
    const jobId = req.params.id;
    const ownership = await getOwnedJob(jobId, req.id);

    if (!ownership.ok) {
      return res.status(ownership.status).json({
        message: ownership.message,
        success: false,
      });
    }

    const job = await Job.findById(jobId).populate({
      path: "applications",
      options: { sort: { createdAt: -1 } },
      populate: { path: "applicant" },
    });

    return res.status(200).json({
      job,
      success: true,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Unable to fetch applicants",
      success: false,
    });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const applicationId = req.params.id;

    if (!status) {
      return res.status(400).json({
        message: "Status is required",
        success: false,
      });
    }

    const ownership = await getOwnedApplication(applicationId, req.id);
    if (!ownership.ok) {
      return res.status(ownership.status).json({
        message: ownership.message,
        success: false,
      });
    }

    ownership.application.status = status.toLowerCase();
    await ownership.application.save();

    return res.status(200).json({
      message: "Status updated successfully",
      success: true,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Unable to update application status",
      success: false,
    });
  }
};
