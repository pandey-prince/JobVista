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

export const getJobLocationText = (job = {}) =>
  [job.location, job.candidate_required_location].filter(Boolean).join(" ").trim();

export const isIndiaJob = (job = {}) => {
  const location = getJobLocationText(job);

  if (!location) {
    return !job.external;
  }

  const hasIndia = INDIA_PATTERNS.some((pattern) => pattern.test(location));
  const hasNonIndia = NON_INDIA_PATTERNS.some((pattern) => pattern.test(location));

  if (hasNonIndia && !hasIndia) return false;
  if (hasIndia) return true;

  if (/remote/i.test(location) && !hasNonIndia) return true;

  return false;
};

export const filterIndiaJobs = (jobs = []) => jobs.filter(isIndiaJob);
