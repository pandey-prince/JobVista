const normalizeTerms = (values = []) =>
  values.map((value) => String(value).toLowerCase().trim()).filter(Boolean);

const getJobText = (job = {}) =>
  [job.title, job.description, job.company?.name, ...(job.requirements || [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

export const scoreJobForProfile = (job, profile = {}) => {
  const skills = normalizeTerms(profile.skills);
  const roles = normalizeTerms(profile.preferredJobRoles);
  const jobText = getJobText(job);

  if (!skills.length && !roles.length) return 0;

  let score = 0;
  for (const skill of skills) {
    if (jobText.includes(skill)) score += 2;
  }
  for (const role of roles) {
    if (jobText.includes(role)) score += 3;
  }
  return score;
};

export const recommendJobs = (jobs = [], profile = {}, { limit = 12 } = {}) => {
  const hasProfileSignals =
    (profile.skills?.length || 0) > 0 || (profile.preferredJobRoles?.length || 0) > 0;

  if (!hasProfileSignals) {
    return [...jobs]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, limit);
  }

  return [...jobs]
    .map((job) => ({ job, score: scoreJobForProfile(job, profile) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.job.createdAt || 0) - new Date(a.job.createdAt || 0);
    })
    .filter((entry) => entry.score > 0)
    .map((entry) => entry.job)
    .slice(0, limit);
};
