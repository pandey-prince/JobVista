import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { TrackedApplication } from "../models/trackedApplication.model.js";

export const syncInternalApplicationToTracker = async (userId, jobId, applicationId) => {
  const job = await Job.findById(jobId).populate("company");
  if (!job) return null;

  const existing = await TrackedApplication.findOne({
    user: userId,
    jobKey: String(jobId),
  });
  if (existing) return existing;

  return TrackedApplication.create({
    user: userId,
    jobKey: String(jobId),
    title: job.title,
    companyName: job.company?.name || "",
    location: job.location || "",
    applicationUrl: "",
    sourceType: "recruiter",
    stage: "applied",
    isManual: false,
    internalApplicationId: applicationId,
  });
};

export const migrateLegacyApplications = async (userId) => {
  const applications = await Application.find({ applicant: userId }).populate({
    path: "job",
    populate: { path: "company" },
  });

  for (const application of applications) {
    if (!application.job) continue;
    const jobKey = String(application.job._id);
    const exists = await TrackedApplication.findOne({ user: userId, jobKey });
    if (exists) continue;

    const stageMap = {
      accepted: "offer",
      rejected: "rejected",
      pending: "applied",
    };

    await TrackedApplication.create({
      user: userId,
      jobKey,
      title: application.job.title,
      companyName: application.job.company?.name || "",
      location: application.job.location || "",
      sourceType: "recruiter",
      stage: stageMap[application.status] || "applied",
      appliedAt: application.createdAt,
      isManual: false,
      internalApplicationId: application._id,
    });
  }
};
