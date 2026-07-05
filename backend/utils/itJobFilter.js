const IT_TITLE_KEYWORDS = [
  "software",
  "engineer",
  "developer",
  "devops",
  "dev ops",
  "sre",
  "site reliability",
  "frontend",
  "front end",
  "front-end",
  "backend",
  "back end",
  "back-end",
  "fullstack",
  "full stack",
  "full-stack",
  "programmer",
  "data scientist",
  "data engineer",
  "machine learning",
  "ml engineer",
  "ai engineer",
  "cloud engineer",
  "cloud architect",
  "infrastructure engineer",
  "platform engineer",
  "security engineer",
  "cybersecurity",
  "qa engineer",
  "test engineer",
  "automation engineer",
  "sdet",
  "ios developer",
  "android developer",
  "mobile developer",
  "mobile engineer",
  "database administrator",
  "dba",
  "solutions architect",
  "systems engineer",
  "network engineer",
  "web developer",
  "ui engineer",
  "ux engineer",
  "product engineer",
  "embedded engineer",
  "firmware engineer",
  "it support",
  "it specialist",
  "help desk",
  "helpdesk",
  "technical lead",
  "tech lead",
  "engineering manager",
  "engineering director",
  "staff engineer",
  "principal engineer",
  "architect",
];

const IT_SUPPORTING_KEYWORDS = [
  "javascript",
  "typescript",
  "python",
  " react ",
  " node.js",
  "nodejs",
  "kubernetes",
  "terraform",
  "aws",
  "azure",
  "gcp",
  "sql",
  "api development",
];

const NON_IT_TITLE_PATTERNS = [
  /\bmarketing\b/i,
  /\bcountry marketing\b/i,
  /\bbrand\b/i,
  /\bcommunications\b/i,
  /\bsales\b/i,
  /\baccount executive\b/i,
  /\bbusiness development\b/i,
  /\brecruiter\b/i,
  /\brecruiting\b/i,
  /\btalent acquisition\b/i,
  /\bhuman resources\b/i,
  /\bpeople (partner|operations|analytics)\b/i,
  /\bfinance\b/i,
  /\bfinancial\b/i,
  /\bforecasting\b/i,
  /\brevenue\b/i,
  /\bfinancial analyst\b/i,
  /\baccountant\b/i,
  /\baccounting\b/i,
  /\baccounts (payable|receivable)\b/i,
  /\blegal\b/i,
  /\bcounsel\b/i,
  /\bparalegal\b/i,
  /\bcustomer success\b/i,
  /\baccount manager\b/i,
  /\bcopywriter\b/i,
  /\bcontent (writer|strategist)\b/i,
  /\bsocial media\b/i,
  /\boffice manager\b/i,
  /\bexecutive assistant\b/i,
  /\badministrative\b/i,
  /\bfacilities\b/i,
  /\boperations manager\b/i,
  /\bpartnerships?\b/i,
  /\bcommunity manager\b/i,
  /\bevents?\b/i,
  /\bpublic relations\b/i,
  /\bcountry manager\b/i,
  /\bregional partner\b/i,
  /\bpartner manager\b/i,
  /\bprogram manager\b/i,
  /\bproject manager\b/i,
  /\bproduct manager\b/i,
  /\bhr\b/i,
];

const matchesKeyword = (text, keywords) =>
  keywords.some((keyword) => text.includes(keyword));

export const getJobSearchText = (job = {}) =>
  [
    job.title,
    job.description,
    job.category,
    job.company_name,
    job.companyName,
    job.location,
    job.jobType,
    job.experienceLevel,
    ...(job.requirements || []),
    ...(job.tags || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const getTitleAndRequirementsText = (job = {}) =>
  [job.title, ...(job.requirements || []), ...(job.tags || [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

export const isItJob = (job = {}) => {
  const title = String(job.title || "");
  const titleLower = title.toLowerCase();
  const titleAndRequirements = getTitleAndRequirementsText(job);

  if (NON_IT_TITLE_PATTERNS.some((pattern) => pattern.test(title))) {
    return false;
  }

  if (matchesKeyword(titleLower, IT_TITLE_KEYWORDS)) {
    return true;
  }

  if (matchesKeyword(titleAndRequirements, IT_SUPPORTING_KEYWORDS)) {
    return true;
  }

  if (
    /\b(engineer|developer|architect|programmer|devops|sre)\b/i.test(title)
  ) {
    return true;
  }

  return false;
};

export const filterItJobs = (jobs = []) => jobs.filter(isItJob);
