/**
 * SmartRecruiters list API returns `ref` as an API URL, e.g.
 * https://api.smartrecruiters.com/v1/companies/Freshworks/postings/744000137424679
 * Applicants need the public careers URL instead.
 */
export const toPublicApplicationUrl = (url = "") => {
  const value = String(url || "").trim();
  if (!value) return "";

  try {
    const parsed = new URL(value);
    if (!parsed.hostname.includes("api.smartrecruiters.com")) {
      return value;
    }

    const match = parsed.pathname.match(
      /^\/v1\/companies\/([^/]+)\/postings\/([^/]+)\/?$/i,
    );
    if (!match) return value;

    const [, company, postingId] = match;
    return `https://jobs.smartrecruiters.com/${company}/${postingId}`;
  } catch {
    return value;
  }
};
