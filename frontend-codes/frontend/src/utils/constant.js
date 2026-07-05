const PRODUCTION_API = "https://jobvista-ahek.onrender.com/api/v1";

export const USER_API_END_POINT =
  import.meta.env.VITE_USER_API_END_POINT ||
  (import.meta.env.PROD ? `${PRODUCTION_API}/user` : undefined);

export const JOB_API_END_POINT =
  import.meta.env.VITE_JOB_API_END_POINT ||
  (import.meta.env.PROD ? `${PRODUCTION_API}/job` : undefined);

export const APPLICATION_API_END_POINT =
  import.meta.env.VITE_APPLICATION_API_END_POINT ||
  (import.meta.env.PROD ? `${PRODUCTION_API}/application` : undefined);

export const COMPANY_API_END_POINT =
  import.meta.env.VITE_COMPANY_API_END_POINT ||
  (import.meta.env.PROD ? `${PRODUCTION_API}/company` : undefined);

export const CHATBOT_API_END_POINT =
  import.meta.env.VITE_CHATBOT_API_END_POINT ||
  USER_API_END_POINT?.replace("/user", "/chatbot") ||
  (import.meta.env.PROD ? `${PRODUCTION_API}/chatbot` : undefined);

export const SCRAPED_JOB_API_END_POINT =
  import.meta.env.VITE_SCRAPED_JOB_API_END_POINT ||
  JOB_API_END_POINT?.replace("/job", "/scraped-jobs") ||
  (import.meta.env.PROD ? `${PRODUCTION_API}/scraped-jobs` : undefined);

export const CAREER_SOURCE_API_END_POINT =
  import.meta.env.VITE_CAREER_SOURCE_API_END_POINT ||
  JOB_API_END_POINT?.replace("/job", "/career-sources") ||
  (import.meta.env.PROD ? `${PRODUCTION_API}/career-sources` : undefined);
