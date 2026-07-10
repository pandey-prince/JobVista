const splitCsv = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const parseJobListFilters = (query = {}) => ({
  locations: splitCsv(query.locations),
  roles: splitCsv(query.roles),
  jobTypes: splitCsv(query.jobTypes),
  experienceLevels: splitCsv(query.experienceLevels),
  workModes: splitCsv(query.workModes),
  postedWithin: splitCsv(query.postedWithin),
});

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

const ROLE_KEYWORDS = {
  "Software Engineer": ["software engineer", "sde", "software developer"],
  "Frontend / React": ["frontend", "front-end", "react", "ui developer"],
  "Backend / Node": ["backend", "back-end", "node", "java developer", "spring"],
  "Full Stack": ["full stack", "fullstack", "full-stack"],
  "DevOps / Cloud": ["devops", "sre", "cloud", "kubernetes", "aws", "platform engineer"],
  "Data / ML / AI": ["data scientist", "data engineer", "machine learning", "ml engineer", "ai engineer"],
  "QA / Testing": ["qa", "quality assurance", "test engineer", "sdet", "automation test"],
  Python: ["python"],
  Java: ["java"],
};

const parseExperienceYears = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value).toLowerCase();
  const match = text.match(/(\d+(\.\d+)?)/);
  if (match) return Number(match[1]);
  if (/\bfresher\b|\bintern\b|\bentry\b/i.test(text)) return 0;
  return null;
};

const EXPERIENCE_RULES = {
  Fresher: (text, job) =>
    /\b(fresher|freshers|entry level|new grad|graduate|0\s*-\s*1|0\s*to\s*1|0\s*years?)\b/i.test(text) ||
    String(job?.experienceLevel || "") === "0",
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
    /\b(internship|intern)\b/i.test(text) || /\bintern\b/i.test(String(job?.jobType || "")),
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

const getSearchableText = (job = {}) =>
  [
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

export const filterJobList = (jobs = [], keyword = "", filters = {}) => {
  const query = String(keyword || "").trim().toLowerCase();

  return jobs.filter((job) => {
    const searchableText = getSearchableText(job);
    if (query && !searchableText.includes(query)) return false;

    if (filters.locations?.length) {
      const locationText = String(job?.location || "").toLowerCase();
      const ok = filters.locations.some((label) => {
        const aliases = LOCATION_ALIASES[label] || [label.toLowerCase()];
        return aliases.some((alias) => locationText.includes(alias));
      });
      if (!ok) return false;
    }

    if (filters.roles?.length) {
      const ok = filters.roles.some((role) => {
        const keywords = ROLE_KEYWORDS[role] || [role.toLowerCase()];
        return keywords.some((item) => searchableText.includes(item));
      });
      if (!ok) return false;
    }

    if (filters.jobTypes?.length) {
      const text = `${job?.jobType || ""} ${job?.title || ""}`.toLowerCase();
      const ok = filters.jobTypes.some((type) => {
        const normalized = type.toLowerCase().replace(/\s+/g, " ");
        if (normalized === "full-time" || normalized === "full time") {
          return (
            /\bfull[- ]?time\b/i.test(text) ||
            (!/\bpart[- ]?time\b/i.test(text) && !/\bintern\b/i.test(text))
          );
        }
        if (normalized === "internship") return /\bintern(ship)?\b/i.test(text);
        if (normalized === "contract") return /\bcontract\b/i.test(text);
        if (normalized === "part-time" || normalized === "part time") {
          return /\bpart[- ]?time\b/i.test(text);
        }
        return text.includes(normalized);
      });
      if (!ok) return false;
    }

    if (filters.experienceLevels?.length) {
      const ok = filters.experienceLevels.some((level) => {
        const rule = EXPERIENCE_RULES[level];
        return rule ? rule(searchableText, job) : searchableText.includes(level.toLowerCase());
      });
      if (!ok) return false;
    }

    if (filters.workModes?.length) {
      const text = `${job?.location || ""} ${job?.jobType || ""} ${job?.title || ""}`.toLowerCase();
      const ok = filters.workModes.some((mode) => {
        const rule = WORK_MODE_RULES[mode];
        return rule ? rule(text) : text.includes(mode.toLowerCase());
      });
      if (!ok) return false;
    }

    if (filters.postedWithin?.length) {
      const createdAt = job?.createdAt ? new Date(job.createdAt).getTime() : null;
      if (createdAt) {
        const now = Date.now();
        const ok = filters.postedWithin.some((label) => {
          const windowMs = POSTED_WITHIN_MS[label];
          return windowMs ? now - createdAt <= windowMs : true;
        });
        if (!ok) return false;
      }
    }

    return true;
  });
};
