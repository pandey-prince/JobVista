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
];

const INDIA_PATTERNS = [
  /\bindia\b/i,
  /\b(bangalore|bengaluru|mumbai|delhi|new delhi|hyderabad|pune|chennai|kolkata)\b/i,
  /\b(gurgaon|gurugram|noida|ahmedabad|chandigarh|kochi|jaipur|indore|bhubaneswar|vizag|visakhapatnam)\b/i,
  /\b(tamil nadu|karnataka|maharashtra|telangana|west bengal|gujarat|rajasthan|uttar pradesh)\b/i,
];

const UNSPECIFIED_LOCATION_PATTERN =
  /^(not\s*specified|n\/?a|none|null|unknown|-|_|\.|tbd|to\s*be\s*decided)?$/i;

export const getJobLocationText = (job = {}) =>
  [job.location, job.candidate_required_location].filter(Boolean).join(" ").trim();

export const isUnspecifiedLocation = (location = "") => {
  const normalized = String(location || "").trim();
  if (!normalized) return true;
  return UNSPECIFIED_LOCATION_PATTERN.test(normalized);
};

export const isIndiaJob = (job = {}) => {
  const location = getJobLocationText(job);

  // Blank / placeholder locations are treated as "not mentioned" → keep.
  if (isUnspecifiedLocation(location)) {
    return true;
  }

  const hasIndia = INDIA_PATTERNS.some((pattern) => pattern.test(location));
  const hasNonIndia = NON_INDIA_PATTERNS.some((pattern) => pattern.test(location));

  if (hasNonIndia && !hasIndia) return false;
  if (hasIndia) return true;

  // Bare Remote (no foreign country signal) → keep.
  if (/remote/i.test(location) && !hasNonIndia) return true;

  return false;
};

export const filterIndiaJobs = (jobs = []) => jobs.filter(isIndiaJob);
