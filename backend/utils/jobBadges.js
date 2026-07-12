const NEW_JOB_DAYS = 7;

export const getDaysSince = (dateValue) => {
  if (!dateValue) return null;
  const created = new Date(dateValue);
  if (Number.isNaN(created.getTime())) return null;
  const difference = Date.now() - created.getTime();
  return Math.max(Math.floor(difference / (1000 * 60 * 60 * 24)), 0);
};

export const isScrapedJobNew = (firstSeenAt) => {
  const days = getDaysSince(firstSeenAt);
  if (days === null) return false;
  return days <= NEW_JOB_DAYS;
};

export const buildFreshnessLabel = (days) => {
  if (days === null) return "Recently posted";
  if (days === 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  if (days <= NEW_JOB_DAYS) return `Posted ${days} days ago`;
  return `Posted ${days} days ago`;
};

export const inferSourceFromJobId = (jobId = "") => {
  const id = String(jobId);
  if (id.startsWith("scraped-")) {
    return { sourceType: "career_page", sourceLabel: null };
  }
  if (id.startsWith("remotive-")) {
    return { sourceType: "remotive", sourceLabel: "Remotive" };
  }
  if (id.startsWith("arbeitnow-")) {
    return { sourceType: "arbeitnow", sourceLabel: "Arbeitnow" };
  }
  return { sourceType: "recruiter", sourceLabel: "JobLeLo" };
};

export const buildJobBadges = ({
  createdAt,
  sourceType,
  sourceLabel,
  jobId,
}) => {
  const inferred = inferSourceFromJobId(jobId);
  const resolvedType = sourceType || inferred.sourceType;
  const resolvedLabel = sourceLabel || inferred.sourceLabel || "Career page";
  const days = getDaysSince(createdAt);
  const isPostedToday = days === 0;
  const isNew = days !== null && days <= NEW_JOB_DAYS;

  return {
    isNew,
    isPostedToday,
    sourceType: resolvedType,
    sourceLabel: resolvedLabel,
    freshnessLabel: buildFreshnessLabel(days),
    isCareerPage: resolvedType === "career_page",
    isDirectFromCompany: resolvedType === "career_page",
  };
};

export const attachBadgesToJob = (job, overrides = {}) => {
  const plain = job?.toObject ? job.toObject() : { ...job };
  const jobId = plain._id?.toString?.() || plain._id || "";
  const createdAt = plain.createdAt || plain.firstSeenAt;
  const sourceLabel =
    overrides.sourceLabel ||
    plain.externalSource ||
    plain.sourceName ||
    plain.company?.name ||
    null;

  const badges = buildJobBadges({
    createdAt,
    sourceType: overrides.sourceType,
    sourceLabel,
    jobId,
  });

  return {
    ...plain,
    badges,
    isNew: badges.isNew,
  };
};
