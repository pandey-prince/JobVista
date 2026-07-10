const PRODUCTION_API = "https://jobvista-ahek.onrender.com/api/v1";
const DEV_API = "http://localhost:8000/api/v1";
const API_ROOT = import.meta.env.PROD ? PRODUCTION_API : DEV_API;

export const USER_API_END_POINT =
  import.meta.env.VITE_USER_API_END_POINT || `${API_ROOT}/user`;

export const JOB_API_END_POINT =
  import.meta.env.VITE_JOB_API_END_POINT || `${API_ROOT}/job`;

export const APPLICATION_API_END_POINT =
  import.meta.env.VITE_APPLICATION_API_END_POINT || `${API_ROOT}/application`;

export const COMPANY_API_END_POINT =
  import.meta.env.VITE_COMPANY_API_END_POINT || `${API_ROOT}/company`;

export const CHATBOT_API_END_POINT =
  import.meta.env.VITE_CHATBOT_API_END_POINT || `${API_ROOT}/chatbot`;

export const SCRAPED_JOB_API_END_POINT =
  import.meta.env.VITE_SCRAPED_JOB_API_END_POINT || `${API_ROOT}/scraped-jobs`;

export const CAREER_SOURCE_API_END_POINT =
  import.meta.env.VITE_CAREER_SOURCE_API_END_POINT || `${API_ROOT}/career-sources`;

export const STATS_API_END_POINT =
  import.meta.env.VITE_STATS_API_END_POINT || `${API_ROOT}/stats`;
