const PRODUCTION_API = "https://jobvista-ahek.onrender.com/api/v1";
const DEV_API = "http://localhost:8000/api/v1";
const API_ROOT = import.meta.env.PROD ? PRODUCTION_API : DEV_API;

/**
 * Only accept real absolute API URLs from Vercel env.
 * Placeholder values like "...admin" must NOT win — they become relative
 * paths on joblelo.online and the SPA returns HTML, which the admin UI
 * surfaces as "Unable to load admin dashboard".
 */
const resolveApiEndpoint = (envValue, fallbackPath) => {
  const trimmed = typeof envValue === "string" ? envValue.trim() : "";
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/$/, "");
  }
  return `${API_ROOT}/${fallbackPath}`;
};

export const USER_API_END_POINT = resolveApiEndpoint(
  import.meta.env.VITE_USER_API_END_POINT,
  "user",
);

export const JOB_API_END_POINT = resolveApiEndpoint(
  import.meta.env.VITE_JOB_API_END_POINT,
  "job",
);

export const APPLICATION_API_END_POINT = resolveApiEndpoint(
  import.meta.env.VITE_APPLICATION_API_END_POINT,
  "application",
);

export const COMPANY_API_END_POINT = resolveApiEndpoint(
  import.meta.env.VITE_COMPANY_API_END_POINT,
  "company",
);

export const CHATBOT_API_END_POINT = resolveApiEndpoint(
  import.meta.env.VITE_CHATBOT_API_END_POINT,
  "chatbot",
);

export const SCRAPED_JOB_API_END_POINT = resolveApiEndpoint(
  import.meta.env.VITE_SCRAPED_JOB_API_END_POINT,
  "scraped-jobs",
);

export const CAREER_SOURCE_API_END_POINT = resolveApiEndpoint(
  import.meta.env.VITE_CAREER_SOURCE_API_END_POINT,
  "career-sources",
);

export const STATS_API_END_POINT = resolveApiEndpoint(
  import.meta.env.VITE_STATS_API_END_POINT,
  "stats",
);

export const SAVED_JOBS_API_END_POINT = resolveApiEndpoint(
  import.meta.env.VITE_SAVED_JOBS_API_END_POINT,
  "saved-jobs",
);

export const DISMISSED_JOBS_API_END_POINT = resolveApiEndpoint(
  import.meta.env.VITE_DISMISSED_JOBS_API_END_POINT,
  "dismissed-jobs",
);

export const ALERTS_API_END_POINT = resolveApiEndpoint(
  import.meta.env.VITE_ALERTS_API_END_POINT,
  "alerts",
);

export const TRACKED_APPLICATIONS_API_END_POINT = resolveApiEndpoint(
  import.meta.env.VITE_TRACKED_APPLICATIONS_API_END_POINT,
  "tracked-applications",
);

export const ADMIN_API_END_POINT = resolveApiEndpoint(
  import.meta.env.VITE_ADMIN_API_END_POINT,
  "admin",
);
