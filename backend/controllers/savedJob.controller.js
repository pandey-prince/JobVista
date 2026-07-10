import { SavedJob } from "../models/savedJob.model.js";
import {
  buildJobSnapshot,
  resolveJobByKey,
  snapshotFromPayload,
} from "../services/jobResolver.service.js";

const toSavedJobResponse = (entry, resolvedJob = null) => ({
  _id: entry._id,
  jobKey: entry.jobKey,
  savedAt: entry.createdAt,
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

export const listSavedJobs = async (req, res) => {
  try {
    const entries = await SavedJob.find({ user: req.id }).sort({ createdAt: -1 });
    const savedJobs = await Promise.all(
      entries.map(async (entry) => {
        const resolved = await resolveJobByKey(entry.jobKey);
        return toSavedJobResponse(entry, resolved);
      }),
    );

    return res.status(200).json({ success: true, savedJobs });
  } catch (error) {
    console.error("[SavedJobs] list failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load saved jobs" });
  }
};

export const saveJob = async (req, res) => {
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
        message: "Unable to save job without title information",
      });
    }

    const saved = await SavedJob.findOneAndUpdate(
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
      message: "Job saved",
      savedJob: toSavedJobResponse(saved),
    });
  } catch (error) {
    console.error("[SavedJobs] save failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to save job" });
  }
};

export const unsaveJob = async (req, res) => {
  try {
    const jobKey = decodeURIComponent(req.params.jobKey);
    const deleted = await SavedJob.findOneAndDelete({ user: req.id, jobKey });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Saved job not found" });
    }

    return res.status(200).json({ success: true, message: "Job removed from saved list" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to remove saved job" });
  }
};

export const checkSavedJob = async (req, res) => {
  try {
    const jobKey = decodeURIComponent(req.params.jobKey);
    const saved = await SavedJob.findOne({ user: req.id, jobKey });

    return res.status(200).json({
      success: true,
      isSaved: Boolean(saved),
      savedJobId: saved?._id || null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to check saved job" });
  }
};

export const listSavedJobKeys = async (req, res) => {
  try {
    const entries = await SavedJob.find({ user: req.id }).select("jobKey");
    return res.status(200).json({
      success: true,
      jobKeys: entries.map((entry) => entry.jobKey),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to load saved job keys" });
  }
};
