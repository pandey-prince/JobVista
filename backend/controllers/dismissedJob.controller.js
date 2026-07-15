import { DismissedJob } from "../models/dismissedJob.model.js";
import {
  buildJobSnapshot,
  resolveJobByKey,
  snapshotFromPayload,
} from "../services/jobResolver.service.js";

const toDismissedJobResponse = (entry, resolvedJob = null) => ({
  _id: entry._id,
  jobKey: entry.jobKey,
  dismissedAt: entry.createdAt,
  jobSnapshot: entry.jobSnapshot,
  job: resolvedJob
    ? {
        _id: resolvedJob._id || entry.jobKey,
        ...resolvedJob,
        company: resolvedJob.company || {
          name: entry.jobSnapshot.companyName,
        },
      }
    : {
        _id: entry.jobKey,
        title: entry.jobSnapshot.title,
        description: entry.jobSnapshot.description,
        location: entry.jobSnapshot.location,
        salary: entry.jobSnapshot.salary,
        applicationLink: entry.jobSnapshot.applicationLink,
        company: { name: entry.jobSnapshot.companyName },
        badges: entry.jobSnapshot.sourceType
          ? { sourceType: entry.jobSnapshot.sourceType }
          : undefined,
      },
});

export const listDismissedJobs = async (req, res) => {
  try {
    const entries = await DismissedJob.find({ user: req.id }).sort({ createdAt: -1 });
    const dismissedJobs = await Promise.all(
      entries.map(async (entry) => {
        const resolved = await resolveJobByKey(entry.jobKey);
        return toDismissedJobResponse(entry, resolved);
      }),
    );

    return res.status(200).json({ success: true, dismissedJobs });
  } catch (error) {
    console.error("[DismissedJobs] list failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load hidden jobs" });
  }
};

export const dismissJob = async (req, res) => {
  try {
    const { jobKey, jobSnapshot, ...jobPayload } = req.body;
    const resolvedKey = jobKey || jobPayload._id;

    if (!resolvedKey) {
      return res.status(400).json({ success: false, message: "jobKey is required" });
    }

    let snapshot = jobSnapshot;
    if (!snapshot?.title) {
      const resolved = await resolveJobByKey(String(resolvedKey));
      snapshot = resolved
        ? buildJobSnapshot(resolved)
        : snapshotFromPayload({ jobKey: resolvedKey, ...jobPayload })?.jobSnapshot;
    }

    if (!snapshot?.title) {
      return res.status(400).json({
        success: false,
        message: "Unable to hide job without title information",
      });
    }

    const dismissed = await DismissedJob.findOneAndUpdate(
      { user: req.id, jobKey: String(resolvedKey) },
      {
        user: req.id,
        jobKey: String(resolvedKey),
        jobSnapshot: snapshot,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return res.status(201).json({
      success: true,
      message: "Job marked as not interested",
      dismissedJob: toDismissedJobResponse(dismissed),
    });
  } catch (error) {
    console.error("[DismissedJobs] dismiss failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to hide job" });
  }
};

export const undismissJob = async (req, res) => {
  try {
    const jobKey = decodeURIComponent(req.params.jobKey);
    const deleted = await DismissedJob.findOneAndDelete({ user: req.id, jobKey });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Hidden job not found" });
    }

    return res.status(200).json({ success: true, message: "Job restored to your feed" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to restore job" });
  }
};

export const listDismissedJobKeys = async (req, res) => {
  try {
    const entries = await DismissedJob.find({ user: req.id }).select("jobKey");
    return res.status(200).json({
      success: true,
      jobKeys: entries.map((entry) => entry.jobKey),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to load hidden job keys" });
  }
};
