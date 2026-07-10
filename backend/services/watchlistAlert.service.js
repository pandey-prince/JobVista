import { UserCompanyList } from "../models/userCompanyList.model.js";
import { sendEmail } from "./email.service.js";
import { buildWatchlistEmail } from "./emailTemplates.service.js";
import { mapScrapedJobForList } from "../services/job-catalog/index.js";
import { filterItJobs } from "../utils/itJobFilter.js";
import { filterIndiaJobs } from "../utils/indiaJobFilter.js";

export const processWatchlistAlerts = async (syncResults = []) => {
  if (!syncResults.length) return { sent: 0 };

  let sent = 0;

  for (const result of syncResults) {
    if (!result.success || result.skipped || !result.newJobs?.length) continue;

    const sourceId = result.sourceId;
    const companyName = result.sourceName;
    const jobs = filterIndiaJobs(filterItJobs(result.newJobs)).map((job) => ({
      ...mapScrapedJobForList(job),
      jobKey: `scraped-${job._id}`,
      companyName: job.companyName || companyName,
    }));

    const watchers = await UserCompanyList.find({
      jobSource: sourceId,
      listType: "watchlist",
      alertEnabled: { $ne: false },
    }).populate("user");

    for (const entry of watchers) {
      const user = entry.user;
      if (!user?.email) continue;

      const emailContent = buildWatchlistEmail({
        userName: user.fullname,
        companyName: entry.companyName || companyName,
        jobs,
      });

      try {
        await sendEmail({
          to: user.email,
          ...emailContent,
        });
        sent += 1;
      } catch (error) {
        console.error(
          `[WatchlistAlert] Failed for ${user.email}:`,
          error.message,
        );
      }
    }
  }

  if (sent > 0) {
    console.log(`[WatchlistAlert] Sent ${sent} instant watchlist emails`);
  }

  return { sent };
};
