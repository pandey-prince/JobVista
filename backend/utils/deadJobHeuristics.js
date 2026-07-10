const DEAD_JOB_PHRASES = [
  "job not found",
  "position not found",
  "posting not found",
  "role not found",
  "page not found",
  "no longer available",
  "position closed",
  "job has been filled",
  "this job has been filled",
  "job is no longer",
  "position is no longer",
  "opening is no longer",
  "this position has been filled",
  "this role has been filled",
  "job posting has expired",
  "posting has expired",
  "404 error",
];

export const isDeadJobHttpStatus = (status) => status === 404 || status === 410;

export const containsDeadJobPhrase = (content = "") => {
  const text = String(content).toLowerCase().slice(0, 50000);
  return DEAD_JOB_PHRASES.some((phrase) => text.includes(phrase));
};

export const classifyLinkCheckResult = ({ status, body = "" }) => {
  if (isDeadJobHttpStatus(status)) {
    return { status: "dead", reason: `http_${status}` };
  }

  if (status >= 200 && status < 400) {
    if (containsDeadJobPhrase(body)) {
      return { status: "dead", reason: "dead_job_phrase" };
    }
    return { status: "alive", reason: "ok" };
  }

  if (status === 403 || status === 429 || status >= 500) {
    return { status: "inconclusive", reason: `http_${status}` };
  }

  return { status: "inconclusive", reason: status ? `http_${status}` : "unknown" };
};

export { DEAD_JOB_PHRASES };
