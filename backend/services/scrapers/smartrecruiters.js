import { stripHtml } from "./normalize.js";
import { fetchJson } from "./fetchHtml.js";
import { toPublicApplicationUrl } from "../../utils/applicationUrl.js";

const PAGE_SIZE = Number(process.env.SMARTRECRUITERS_PAGE_SIZE || 100);
const MAX_PAGES = Number(process.env.SMARTRECRUITERS_MAX_PAGES || 50);

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
  if (posting.company?.identifier && posting.id) {
    return `https://jobs.smartrecruiters.com/${posting.company.identifier}/${posting.id}`;
  }
  if (posting.applyUrl) return toPublicApplicationUrl(posting.applyUrl);
  if (posting.ref) return toPublicApplicationUrl(posting.ref);
  return "";
};

const mapPosting = (posting, companyName) => {
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
    companyName,
    companyLogo: "",
  };
};

export const scrapeSmartrecruiters = async (source) => {
  const slug = extractSlug(source);
  const jobs = [];
  const seen = new Set();
  let offset = 0;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const data = await fetchJson(
      `https://api.smartrecruiters.com/v1/companies/${slug}/postings?limit=${PAGE_SIZE}&offset=${offset}`,
    );

    const postings = data?.content;
    if (!Array.isArray(postings) || !postings.length) {
      break;
    }

    let newOnPage = 0;
    for (const posting of postings) {
      const mapped = mapPosting(posting, source.companyName);
      if (!mapped.externalId || seen.has(mapped.externalId)) continue;
      seen.add(mapped.externalId);
      jobs.push(mapped);
      newOnPage += 1;
    }

    if (!newOnPage) break;

    const totalFound = Number(data?.totalFound);
    offset += postings.length;
    if (Number.isFinite(totalFound) && offset >= totalFound) break;
    if (postings.length < PAGE_SIZE) break;

    // Prefer API next link when present
    const next = data?.next;
    if (typeof next === "string" && next.includes("offset=")) {
      const match = next.match(/[?&]offset=(\d+)/i);
      if (match) offset = Number(match[1]);
    }
  }

  if (!jobs.length) {
    throw new Error("No jobs found on SmartRecruiters");
  }

  return jobs;
};
