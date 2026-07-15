export const emptyJobFilters = {
  locations: [],
  roles: [],
  jobTypes: [],
  experienceLevels: [],
  workModes: [],
  postedWithin: [],
  companies: [],
  sortBy: "newest",
};

export const filtersToQueryParams = (filters = emptyJobFilters) => {
  const params = {};
  Object.entries(filters).forEach(([key, values]) => {
    if (key === "sortBy") {
      if (values && values !== "newest") params.sortBy = values;
      return;
    }
    if (values?.length) params[key] = values.join(",");
  });
  return params;
};

const LOCATION_ALIASES = {
  Bangalore: ["bangalore", "bengaluru", "blr"],
  Hyderabad: ["hyderabad", "secunderabad", "cyberabad"],
  Pune: ["pune"],
  Mumbai: ["mumbai", "thane", "navi mumbai"],
  "Delhi NCR": ["delhi", "ncr", "gurgaon", "gurugram", "noida", "faridabad", "ghaziabad"],
  Chennai: ["chennai"],
  Kolkata: ["kolkata"],
  Ahmedabad: ["ahmedabad"],
  Remote: ["remote", "work from home", "wfh", "anywhere in india"],
};

const ROLE_KEYWORDS = {  "Software Engineer": ["software engineer", "sde", "software developer"],
  "Frontend / React": ["frontend", "front-end", "react", "ui developer"],
  "Backend / Node": ["backend", "back-end", "node", "java developer", "spring"],
  "Full Stack": ["full stack", "fullstack", "full-stack"],
  "DevOps / Cloud": ["devops", "sre", "cloud", "kubernetes", "aws", "platform engineer"],
  "Data / ML / AI": ["data scientist", "data engineer", "machine learning", "ml engineer", "ai engineer"],
  "QA / Testing": ["qa", "quality assurance", "test engineer", "sdet", "automation test"],
  Python: ["python"],
  Java: ["java"],
};

const EXPERIENCE_RULES = {
  Fresher: (text, job) => {
    const exp = String(job?.experienceLevel || "");
    if (exp === "0" || /\bfresher\b|\bintern\b/i.test(exp)) return true;
    const focused = `${job?.title || ""} ${job?.jobType || ""} ${exp}`.toLowerCase();
    return /\b(fresher|freshers|entry level|new grad|graduate|0\s*-\s*1|0\s*to\s*1|0\s*years?)\b/i.test(
      focused,
    );
  },
  "0-1 year": (text, job) => {
    const exp = parseExperienceYears(job?.experienceLevel);
    return exp !== null && exp <= 1;
  },
  "1-3 years": (text, job) => {
    const exp = parseExperienceYears(job?.experienceLevel);
    return exp !== null && exp >= 1 && exp <= 3;
  },
  "3-5 years": (text, job) => {
    const exp = parseExperienceYears(job?.experienceLevel);
    return exp !== null && exp >= 3 && exp <= 5;
  },
  "5+ years": (text, job) => {
    const exp = parseExperienceYears(job?.experienceLevel);
    return exp !== null && exp >= 5;
  },
  Internship: (text, job) =>
    /\b(internship|intern)\b/i.test(`${job?.title || ""} ${job?.jobType || ""}`) ||
    /\bintern\b/i.test(String(job?.jobType || "")),
};

const WORK_MODE_RULES = {
  Remote: (text) => /\b(remote|work from home|wfh)\b/i.test(text),
  Hybrid: (text) => /\bhybrid\b/i.test(text),
  "On-site": (text) =>
    !/\b(remote|work from home|wfh|hybrid)\b/i.test(text) &&
    /\b(on[- ]?site|office|in[- ]?office)\b/i.test(text),
};

const POSTED_WITHIN_MS = {
  "Last 24 hours": 24 * 60 * 60 * 1000,
  "Last 7 days": 7 * 24 * 60 * 60 * 1000,
  "Last 30 days": 30 * 24 * 60 * 60 * 1000,
};

const parseExperienceYears = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value).toLowerCase();
  const match = text.match(/(\d+(\.\d+)?)/);
  if (match) return Number(match[1]);
  if (/\bfresher\b|\bintern\b|\bentry\b/i.test(text)) return 0;
  return null;
};


const matchesLocation = (job, locations) => {
  if (!locations?.length) return true;
  const locationText = String(job?.location || "").toLowerCase();
  return locations.some((label) => {
    const aliases = LOCATION_ALIASES[label] || [label.toLowerCase()];
    return aliases.some((alias) => locationText.includes(alias));
  });
};

const matchesRole = (searchableText, roles) => {
  if (!roles?.length) return true;
  return roles.some((role) => {
    const keywords = ROLE_KEYWORDS[role] || [role.toLowerCase()];
    return keywords.some((keyword) => searchableText.includes(keyword));
  });
};

const matchesJobType = (job, jobTypes) => {
  if (!jobTypes?.length) return true;
  const text = `${job?.jobType || ""} ${job?.title || ""}`.toLowerCase();
  return jobTypes.some((type) => {
    const normalized = type.toLowerCase().replace(/\s+/g, " ");
    if (normalized === "full-time" || normalized === "full time") {
      return /\bfull[- ]?time\b/i.test(text) || (!/\bpart[- ]?time\b/i.test(text) && !/\bintern\b/i.test(text));
    }
    if (normalized === "internship") return /\bintern(ship)?\b/i.test(text);
    if (normalized === "contract") return /\bcontract\b/i.test(text);
    if (normalized === "part-time" || normalized === "part time") return /\bpart[- ]?time\b/i.test(text);
    return text.includes(normalized);
  });
};

const matchesExperience = (searchableText, job, experienceLevels) => {
  if (!experienceLevels?.length) return true;
  return experienceLevels.some((level) => {
    const rule = EXPERIENCE_RULES[level];
    return rule ? rule(searchableText, job) : searchableText.includes(level.toLowerCase());
  });
};

const matchesWorkMode = (job, workModes) => {
  if (!workModes?.length) return true;
  const text = `${job?.location || ""} ${job?.jobType || ""} ${job?.title || ""}`.toLowerCase();
  return workModes.some((mode) => {
    const rule = WORK_MODE_RULES[mode];
    if (rule) return rule(text);
    return text.includes(mode.toLowerCase());
  });
};

const matchesPostedWithin = (job, postedWithin) => {
  if (!postedWithin?.length) return true;
  const createdAt = job?.createdAt ? new Date(job.createdAt).getTime() : null;
  if (!createdAt) return true;

  const now = Date.now();
  return postedWithin.some((label) => {
    const windowMs = POSTED_WITHIN_MS[label];
    return windowMs ? now - createdAt <= windowMs : true;
  });
};

export const filterJobs = (jobs, searchedQuery = "", selectedFilters = emptyJobFilters) => {
  const query = searchedQuery.trim().toLowerCase();

  return jobs.filter((job) => {
    const searchableText = [
      job?.title,
      job?.description,
      job?.location,
      job?.jobType,
      job?.experienceLevel,
      job?.company?.name,
      ...(job?.requirements || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = !query || searchableText.includes(query);

    return (
      matchesSearch &&
      matchesLocation(job, selectedFilters.locations) &&
      matchesRole(searchableText, selectedFilters.roles) &&
      matchesJobType(job, selectedFilters.jobTypes) &&
      matchesExperience(searchableText, job, selectedFilters.experienceLevels) &&
      matchesWorkMode(job, selectedFilters.workModes) &&
      matchesPostedWithin(job, selectedFilters.postedWithin)
    );
  });
};
