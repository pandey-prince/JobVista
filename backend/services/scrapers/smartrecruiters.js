import { stripHtml } from "./normalize.js";
import { fetchJson } from "./fetchHtml.js";

const extractSlug = (source) => {
  if (source.selectors?.slug) return source.selectors.slug;

  try {
    const parsed = new URL(source.url);
    if (parsed.hostname.includes("smartrecruiters.com")) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      return parts[0] || "";
    }
  } catch {
    /* fall through */
  }

  throw new Error("SmartRecruiters scraper requires a company slug");
};

const buildJobUrl = (posting) => {
  if (posting.ref) return posting.ref;
  if (posting.company?.identifier && posting.id) {
    return `https://jobs.smartrecruiters.com/${posting.company.identifier}/${posting.id}`;
  }
  return posting.applyUrl || "";
};

export const scrapeSmartrecruiters = async (source) => {
  const slug = extractSlug(source);
  const data = await fetchJson(
    `https://api.smartrecruiters.com/v1/companies/${slug}/postings?limit=100`
  );

  const postings = data?.content;
  if (!Array.isArray(postings) || !postings.length) {
    throw new Error("No jobs found on SmartRecruiters");
  }

  return postings.map((posting) => {
    const locationParts = [
      posting.location?.city,
      posting.location?.region,
      posting.location?.country,
    ].filter(Boolean);

    return {
      externalId: posting.id || posting.uuid,
      title: posting.name,
      description: stripHtml(posting.jobAd?.sections?.jobDescription?.text || posting.name),
      location: locationParts.join(", ") || "Not specified",
      jobType: posting.typeOfEmployment?.label || "Full-time",
      salary: "Not disclosed",
      requirements: [],
      applicationUrl: buildJobUrl(posting),
      companyName: source.companyName,
      companyLogo: "",
    };
  });
};
