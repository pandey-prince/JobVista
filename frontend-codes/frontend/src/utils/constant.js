export const USER_API_END_POINT = import.meta.env.VITE_USER_API_END_POINT;

//"http://localhost:8000/api/v1/user";
export const JOB_API_END_POINT = import.meta.env.VITE_JOB_API_END_POINT;

//"http://localhost:8000/api/v1/job";
export const APPLICATION_API_END_POINT = import.meta.env
  .VITE_APPLICATION_API_END_POINT;

//"http://localhost:8000/api/v1/application";
export const COMPANY_API_END_POINT = import.meta.env.VITE_COMPANY_API_END_POINT;

//"http://localhost:8000/api/v1/company";
export const CHATBOT_API_END_POINT =
  import.meta.env.VITE_CHATBOT_API_END_POINT ||
  USER_API_END_POINT?.replace("/user", "/chatbot");

export const SCRAPED_JOB_API_END_POINT =
  import.meta.env.VITE_SCRAPED_JOB_API_END_POINT ||
  JOB_API_END_POINT?.replace("/job", "/scraped-jobs");

export const CAREER_SOURCE_API_END_POINT =
  import.meta.env.VITE_CAREER_SOURCE_API_END_POINT ||
  JOB_API_END_POINT?.replace("/job", "/career-sources");
