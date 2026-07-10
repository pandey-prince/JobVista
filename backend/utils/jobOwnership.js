import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";

export const getOwnedJob = async (jobId, recruiterId) => {
  const job = await Job.findById(jobId);
  if (!job) {
    return { ok: false, status: 404, message: "Job not found" };
  }

  if (String(job.created_by) !== String(recruiterId)) {
    return { ok: false, status: 403, message: "You are not allowed to manage this job" };
  }

  return { ok: true, job };
};

export const getOwnedApplication = async (applicationId, recruiterId) => {
  const application = await Application.findById(applicationId).populate({
    path: "job",
    select: "created_by title",
  });

  if (!application) {
    return { ok: false, status: 404, message: "Application not found" };
  }

  if (!application.job || String(application.job.created_by) !== String(recruiterId)) {
    return {
      ok: false,
      status: 403,
      message: "You are not allowed to update this application",
    };
  }

  return { ok: true, application };
};
