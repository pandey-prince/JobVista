const SOURCE_STYLES = {
  career_page: {
    label: "Career page",
    className:
      "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800",
  },
  recruiter: {
    label: "JobLeLo",
    className:
      "bg-brand-muted text-brand border-brand/30 dark:border-brand/40",
  },
  remotive: {
    label: "Remotive",
    className: "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-200 dark:border-sky-800",
  },
  arbeitnow: {
    label: "Arbeitnow",
    className: "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-200 dark:border-sky-800",
  },
};

export const getJobBadges = (job) => {
  if (job?.badges) return job.badges;

  const jobId = String(job?._id || "");
  const createdAt = job?.createdAt;
  const days = createdAt
    ? Math.max(
        Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)),
        0,
      )
    : null;

  let sourceType = "career_page";
  if (jobId.startsWith("scraped-")) sourceType = "career_page";
  else if (jobId.startsWith("remotive-")) sourceType = "remotive";
  else if (jobId.startsWith("arbeitnow-")) sourceType = "arbeitnow";

  return {
    isNew: job?.isNew || (days !== null && days <= 7),
    isPostedToday: days === 0,
    sourceType,
    sourceLabel: job?.externalSource || job?.company?.name || "Career page",
    freshnessLabel:
      days === 0 ? "Posted today" : days === 1 ? "Posted yesterday" : days !== null ? `Posted ${days} days ago` : "Recently posted",
    isCareerPage: sourceType === "career_page",
  };
};

export const getSourceBadgeStyle = (sourceType, sourceLabel) => {
  const config = SOURCE_STYLES[sourceType] || SOURCE_STYLES.career_page;
  const label =
    sourceType === "career_page" && sourceLabel
      ? `From ${sourceLabel}`
      : config.label;

  return { label, className: config.className };
};
