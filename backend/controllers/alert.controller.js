import { JobAlert } from "../models/jobAlert.model.js";
import { User } from "../models/user.model.js";
import { sendTestEmail } from "../services/email.service.js";
import {
  filterJobsForAlert,
  getJobKey,
  getRecentJobsSince,
} from "../services/alertMatcher.service.js";
import { buildDigestEmail } from "../services/emailTemplates.service.js";
import { sendEmail } from "../services/email.service.js";

const sanitizeAlertInput = (body = {}) => ({
  name: body.name?.trim(),
  keyword: body.keyword?.trim() || "",
  location: body.location?.trim() || "",
  experienceLevel: body.experienceLevel?.trim() || "",
  companyName: body.companyName?.trim() || "",
  sourceType: body.sourceType || "",
  frequency: body.frequency === "instant" ? "instant" : "daily",
  isActive: body.isActive !== false,
});

export const listAlerts = async (req, res) => {
  try {
    const alerts = await JobAlert.find({ user: req.id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, alerts });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to load alerts" });
  }
};

export const createAlert = async (req, res) => {
  try {
    const input = sanitizeAlertInput(req.body);
    if (!input.name) {
      return res.status(400).json({ success: false, message: "Alert name is required" });
    }

    const alert = await JobAlert.create({
      user: req.id,
      ...input,
    });

    return res.status(201).json({ success: true, alert, message: "Alert created" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to create alert" });
  }
};

export const updateAlert = async (req, res) => {
  try {
    const input = sanitizeAlertInput(req.body);
    const alert = await JobAlert.findOne({ _id: req.params.id, user: req.id });

    if (!alert) {
      return res.status(404).json({ success: false, message: "Alert not found" });
    }

    if (input.name) alert.name = input.name;
    alert.keyword = input.keyword;
    alert.location = input.location;
    alert.experienceLevel = input.experienceLevel;
    alert.companyName = input.companyName;
    alert.sourceType = input.sourceType;
    alert.frequency = input.frequency;
    alert.isActive = input.isActive;
    await alert.save();

    return res.status(200).json({ success: true, alert, message: "Alert updated" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to update alert" });
  }
};

export const deleteAlert = async (req, res) => {
  try {
    const alert = await JobAlert.findOneAndDelete({ _id: req.params.id, user: req.id });
    if (!alert) {
      return res.status(404).json({ success: false, message: "Alert not found" });
    }
    return res.status(200).json({ success: true, message: "Alert deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to delete alert" });
  }
};

export const sendAlertTest = async (req, res) => {
  try {
    const user = await User.findById(req.id);
    if (!user?.email) {
      return res.status(400).json({ success: false, message: "User email not found" });
    }

    const result = await sendTestEmail(user.email);
    return res.status(200).json({
      success: true,
      message: result.skipped
        ? "Email service not configured (RESEND_API_KEY missing)"
        : "Test email sent",
      skipped: Boolean(result.skipped),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const previewAlertMatches = async (req, res) => {
  try {
    const alert = await JobAlert.findOne({ _id: req.params.id, user: req.id });
    if (!alert) {
      return res.status(404).json({ success: false, message: "Alert not found" });
    }

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const jobs = await getRecentJobsSince(since);
    const matches = filterJobsForAlert(jobs, alert, alert.lastMatchedJobKeys).slice(0, 10);

    return res.status(200).json({ success: true, matches, count: matches.length });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to preview alert matches" });
  }
};

export const sendAlertNow = async (req, res) => {
  try {
    const alert = await JobAlert.findOne({ _id: req.params.id, user: req.id }).populate("user");
    if (!alert) {
      return res.status(404).json({ success: false, message: "Alert not found" });
    }

    const since = alert.lastSentAt || new Date(Date.now() - 24 * 60 * 60 * 1000);
    const jobs = await getRecentJobsSince(since);
    const matches = filterJobsForAlert(jobs, alert, alert.lastMatchedJobKeys).slice(0, 10);

    if (!matches.length) {
      return res.status(200).json({
        success: true,
        message: "No new matching jobs right now",
        sent: false,
      });
    }

    const emailContent = buildDigestEmail({
      userName: alert.user.fullname,
      alertName: alert.name,
      jobs: matches,
    });

    await sendEmail({ to: alert.user.email, ...emailContent });
    alert.lastSentAt = new Date();
    alert.lastMatchedJobKeys = [
      ...new Set([...(alert.lastMatchedJobKeys || []), ...matches.map(getJobKey)]),
    ].slice(-200);
    await alert.save();

    return res.status(200).json({
      success: true,
      message: `Sent ${matches.length} matching jobs`,
      sent: true,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
