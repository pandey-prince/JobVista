import {
  isVagueLocation,
  normalizeJobLocation,
} from "./jobLocation.js";

const NON_INDIA_PATTERNS = [
  /\b(united states|usa|u\.s\.a|u\.s\.)\b/i,
  /\b(united kingdom|uk)\b/i,
  /\b(london|dublin|berlin|amsterdam|paris|munich|frankfurt|zurich)\b/i,
  /\b(canada|toronto|vancouver|montreal)\b/i,
  /\b(australia|sydney|melbourne)\b/i,
  /\b(singapore)\b/i,
  /\b(europe|emea|apac)\b/i,
  /\b(san francisco|new york|seattle|austin|boston|chicago|los angeles|denver)\b/i,
  /\b(japan|tokyo|china|beijing|shanghai|hong kong)\b/i,
  /\b(latin america|brazil|mexico)\b/i,
  /\b(middle east|dubai|uae)\b/i,
  /\b(poland|warsaw|krakow|kraków|wroclaw|wrocław)\b/i,
  /\b(germany|france|spain|italy|netherlands|sweden|ireland|portugal)\b/i,
  /\b(taiwan|korea|seoul|manila|jakarta|thailand|bangkok|vietnam)\b/i,
  /\b(israel|tel aviv|south africa)\b/i,
];

const INDIA_PATTERNS = [
  /\bindia\b/i,
  /\b(bangalore|bengaluru|mumbai|delhi|new delhi|hyderabad|pune|chennai|kolkata)\b/i,
  /\b(gurgaon|gurugram|noida|ahmedabad|chandigarh|kochi|jaipur|indore|bhubaneswar|vizag|visakhapatnam)\b/i,
  /\b(tamil nadu|karnataka|maharashtra|telangana|west bengal|gujarat|rajasthan|uttar pradesh)\b/i,
];

export const getJobLocationText = (job = {}) =>
  [job.location, job.candidate_required_location].filter(Boolean).join(" ").trim();

/** @deprecated Use isVagueLocation from jobLocation.js */
export const isUnspecifiedLocation = isVagueLocation;

/**
 * Strict India gate: require an India city/country signal.
 * Blank, "Not specified", bare "Remote", and foreign cities are rejected.
 * Title may supply the India place when the board location is junk.
 */
export const isIndiaJob = (job = {}) => {
  const rawLocation = getJobLocationText(job);
  const location = normalizeJobLocation(rawLocation, { title: job.title || "" });
  const title = String(job.title || "");

  // Search India signal in normalized location, raw location, and title.
  const haystack = [location, rawLocation, title].filter(Boolean).join(" ");
  const hasIndia = INDIA_PATTERNS.some((pattern) => pattern.test(haystack));
  const hasNonIndia = NON_INDIA_PATTERNS.some((pattern) => pattern.test(haystack));

  // Explicit India wins even on multi-location boards (India + elsewhere).
  if (hasIndia) return true;

  // Foreign-only (or foreign with no India city) → drop.
  if (hasNonIndia) return false;

  // Bare remote / vague / empty with no India signal → drop.
  if (isVagueLocation(location) || isVagueLocation(rawLocation)) {
    return false;
  }

  if (/^remote\b/i.test(location) || /^remote\b/i.test(rawLocation)) {
    return false;
  }

  return false;
};

export const filterIndiaJobs = (jobs = []) => jobs.filter(isIndiaJob);
