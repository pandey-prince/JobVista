import { JobAlert } from "../models/jobAlert.model.js";
import { User } from "../models/user.model.js";
import { sendEmail } from "./email.service.js";
import { buildDigestEmail } from "./emailTemplates.service.js";
import {
  filterJobsForAlert,
  getJobKey,
  getRecentJobsSince,
} from "./alertMatcher.service.js";

const MAX_JOBS_PER_EMAIL = 10;

export const runDailyAlertDigest = async () => {
  const alerts = await JobAlert.find({
    isActive: true,
    frequency: "daily",
  }).populate("user");

  if (!alerts.length) {
    console.log("[AlertDigest] No active daily alerts");
    return { processed: 0, sent: 0 };
  }

  let sent = 0;
  const oldestSince = alerts.reduce((min, alert) => {
    const since = alert.lastSentAt || new Date(Date.now() - 24 * 60 * 60 * 1000);
    return !min || since < min ? since : min;
  }, null);

  const recentJobs = await getRecentJobsSince(oldestSince);

  for (const alert of alerts) {
    const user = alert.user;
    if (!user?.email) continue;

    const since = alert.lastSentAt || new Date(Date.now() - 24 * 60 * 60 * 1000);
    const jobsSince = recentJobs.filter(
      (job) => new Date(job.createdAt || 0) >= since,
    );
    const matches = filterJobsForAlert(
      jobsSince,
      alert,
      alert.lastMatchedJobKeys || [],
    ).slice(0, MAX_JOBS_PER_EMAIL);

    if (!matches.length) continue;

    const emailContent = buildDigestEmail({
      userName: user.fullname,
      alertName: alert.name,
      jobs: matches,
    });

    try {
      await sendEmail({
        to: user.email,
        ...emailContent,
      });

      alert.lastSentAt = new Date();
      alert.lastMatchedJobKeys = [
        ...new Set([
          ...(alert.lastMatchedJobKeys || []),
          ...matches.map(getJobKey),
        ]),
      ].slice(-200);
      await alert.save();
      sent += 1;
    } catch (error) {
      console.error(`[AlertDigest] Failed for alert ${alert._id}:`, error.message);
    }
  }

  console.log(`[AlertDigest] Processed ${alerts.length} alerts, sent ${sent} emails`);
  return { processed: alerts.length, sent };
};
