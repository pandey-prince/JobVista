import { TrackedApplication, TRACKED_STAGES } from "../models/trackedApplication.model.js";
import { migrateLegacyApplications } from "../services/trackedApplication.service.js";
import {
  buildJobSnapshot,
  resolveJobByKey,
} from "../services/jobResolver.service.js";

const toResponse = (entry) => ({
  _id: entry._id,
  jobKey: entry.jobKey,
  title: entry.title,
  companyName: entry.companyName,
  location: entry.location,
  applicationUrl: entry.applicationUrl,
  sourceType: entry.sourceType,
  stage: entry.stage,
  appliedAt: entry.appliedAt,
  notes: entry.notes,
  isManual: entry.isManual,
  createdAt: entry.createdAt,
  updatedAt: entry.updatedAt,
});

export const listTrackedApplications = async (req, res) => {
  try {
    await migrateLegacyApplications(req.id);
    const entries = await TrackedApplication.find({ user: req.id }).sort({
      updatedAt: -1,
    });
    return res.status(200).json({
      success: true,
      applications: entries.map(toResponse),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to load application tracker",
    });
  }
};

export const createTrackedApplication = async (req, res) => {
  try {
    const {
      jobKey,
      title,
      companyName,
      location,
      applicationUrl,
      sourceType,
      notes,
      stage,
    } = req.body;

    if (!title && !jobKey) {
      return res.status(400).json({
        success: false,
        message: "Title or jobKey is required",
      });
    }

    let payload = {
      title,
      companyName: companyName || "",
      location: location || "",
      applicationUrl: applicationUrl || "",
      sourceType: sourceType || "",
      notes: notes || "",
      stage: TRACKED_STAGES.includes(stage) ? stage : "applied",
      isManual: true,
    };

    if (jobKey) {
      const existing = await TrackedApplication.findOne({
        user: req.id,
        jobKey: String(jobKey),
      });
      if (existing) {
        return res.status(200).json({
          success: true,
          message: "Already tracking this job",
          application: toResponse(existing),
        });
      }

      const resolved = await resolveJobByKey(String(jobKey));
      if (resolved) {
        const snapshot = buildJobSnapshot(resolved);
        payload = {
          ...payload,
          title: payload.title || snapshot.title,
          companyName: payload.companyName || snapshot.companyName,
          location: payload.location || snapshot.location,
          applicationUrl: payload.applicationUrl || snapshot.applicationLink,
          sourceType: payload.sourceType || snapshot.sourceType,
        };
      }
    }

    const entry = await TrackedApplication.create({
      user: req.id,
      jobKey: jobKey ? String(jobKey) : "",
      ...payload,
    });

    return res.status(201).json({
      success: true,
      message: "Application tracked",
      application: toResponse(entry),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to track application",
    });
  }
};

export const updateTrackedApplication = async (req, res) => {
  try {
    const { stage, notes } = req.body;
    const entry = await TrackedApplication.findOne({
      _id: req.params.id,
      user: req.id,
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "Tracked application not found",
      });
    }

    if (stage && TRACKED_STAGES.includes(stage)) {
      entry.stage = stage;
    }
    if (typeof notes === "string") {
      entry.notes = notes;
    }
    await entry.save();

    return res.status(200).json({
      success: true,
      message: "Application updated",
      application: toResponse(entry),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to update application",
    });
  }
};

export const deleteTrackedApplication = async (req, res) => {
  try {
    const entry = await TrackedApplication.findOneAndDelete({
      _id: req.params.id,
      user: req.id,
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "Tracked application not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Application removed from tracker",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to delete tracked application",
    });
  }
};
