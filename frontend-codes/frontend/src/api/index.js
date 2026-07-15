import apiClient from "./client";
import {
  USER_API_END_POINT,
  SAVED_JOBS_API_END_POINT,
  DISMISSED_JOBS_API_END_POINT,
  ALERTS_API_END_POINT,
  TRACKED_APPLICATIONS_API_END_POINT,
  JOB_API_END_POINT,
  CAREER_SOURCE_API_END_POINT,
  STATS_API_END_POINT,
  ADMIN_API_END_POINT,
  APPLICATION_API_END_POINT,
  SCRAPED_JOB_API_END_POINT,
} from "@/utils/constant";

export const adminApi = {
  dashboard: (params = {}) => apiClient.get(`${ADMIN_API_END_POINT}/dashboard`, { params }),
  listSources: () => apiClient.get(`${ADMIN_API_END_POINT}/sources`),
};

export const authApi = {
  me: () => apiClient.get(`${USER_API_END_POINT}/me`),
  login: (payload) => apiClient.post(`${USER_API_END_POINT}/login`, payload),
  register: (payload) => apiClient.post(`${USER_API_END_POINT}/register`, payload),
  verifyEmail: (payload) => apiClient.post(`${USER_API_END_POINT}/verify-email`, payload),
  resendOtp: (payload) => apiClient.post(`${USER_API_END_POINT}/resend-otp`, payload),
  googleLogin: (payload) => apiClient.post(`${USER_API_END_POINT}/google`, payload),
  logout: () => apiClient.post(`${USER_API_END_POINT}/logout`),
};

export const savedJobsApi = {
  list: () => apiClient.get(`${SAVED_JOBS_API_END_POINT}/`),
  keys: () => apiClient.get(`${SAVED_JOBS_API_END_POINT}/keys`),
  save: (payload) => apiClient.post(`${SAVED_JOBS_API_END_POINT}/`, payload),
  remove: (jobKey) =>
    apiClient.delete(`${SAVED_JOBS_API_END_POINT}/${encodeURIComponent(jobKey)}`),
};

export const dismissedJobsApi = {
  list: () => apiClient.get(`${DISMISSED_JOBS_API_END_POINT}/`),
  keys: () => apiClient.get(`${DISMISSED_JOBS_API_END_POINT}/keys`),
  dismiss: (payload) => apiClient.post(`${DISMISSED_JOBS_API_END_POINT}/`, payload),
  remove: (jobKey) =>
    apiClient.delete(`${DISMISSED_JOBS_API_END_POINT}/${encodeURIComponent(jobKey)}`),
};

export const alertsApi = {
  list: () => apiClient.get(`${ALERTS_API_END_POINT}/`),
  create: (payload) => apiClient.post(`${ALERTS_API_END_POINT}/`, payload),
  update: (id, payload) => apiClient.put(`${ALERTS_API_END_POINT}/${id}`, payload),
  remove: (id) => apiClient.delete(`${ALERTS_API_END_POINT}/${id}`),
  testEmail: () => apiClient.post(`${ALERTS_API_END_POINT}/test-email`),
};

export const trackerApi = {
  list: () => apiClient.get(`${TRACKED_APPLICATIONS_API_END_POINT}/`),
  create: (payload) => apiClient.post(`${TRACKED_APPLICATIONS_API_END_POINT}/`, payload),
  update: (id, payload) =>
    apiClient.patch(`${TRACKED_APPLICATIONS_API_END_POINT}/${id}`, payload),
  remove: (id) => apiClient.delete(`${TRACKED_APPLICATIONS_API_END_POINT}/${id}`),
};

export const jobsApi = {
  list: ({ keyword = "", page = 1, limit = 30, ...filterParams } = {}) =>
    apiClient.get(`${JOB_API_END_POINT}/get`, {
      params: { keyword, page, limit, ...filterParams },
    }),
  getById: (id) => apiClient.get(`${JOB_API_END_POINT}/get/${id}`),
  getScrapedById: (id) => apiClient.get(`${SCRAPED_JOB_API_END_POINT}/${id}`),
  matchScore: (jobKey) => apiClient.post(`${JOB_API_END_POINT}/match-score`, { jobKey }),
  recommended: ({ limit = 12 } = {}) =>
    apiClient.get(`${JOB_API_END_POINT}/recommended`, { params: { limit } }),
};

export const applicationsApi = {
  apply: (jobId) => apiClient.post(`${APPLICATION_API_END_POINT}/apply/${jobId}`),
};

export const careerSourceApi = {
  listPublic: ({ page = 1, limit = 20, search = "" } = {}) =>
    apiClient.get(`${CAREER_SOURCE_API_END_POINT}/`, {
      params: { page, limit, search },
    }),
  getCompanyJobs: (slug, { page = 1, limit = 12, keyword = "" } = {}) =>
    apiClient.get(`${CAREER_SOURCE_API_END_POINT}/${encodeURIComponent(slug)}/jobs`, {
      params: { page, limit, keyword },
    }),
  listUserLists: (type, { page = 1, limit = 10 } = {}) =>
    apiClient.get(`${CAREER_SOURCE_API_END_POINT}/lists`, {
      params: { type, page, limit },
    }),
  listWatchlistJobs: ({ page = 1, limit = 8 } = {}) =>
    apiClient.get(`${CAREER_SOURCE_API_END_POINT}/lists/jobs`, {
      params: { type: "watchlist", page, limit },
    }),
  submit: (payload) => apiClient.post(`${CAREER_SOURCE_API_END_POINT}/submit`, payload),
  addList: (payload) => apiClient.post(`${CAREER_SOURCE_API_END_POINT}/lists`, payload),
  updateList: (id, payload) =>
    apiClient.patch(`${CAREER_SOURCE_API_END_POINT}/lists/${id}`, payload),
  removeList: (id) => apiClient.delete(`${CAREER_SOURCE_API_END_POINT}/lists/${id}`),
};

export const statsApi = {
  public: () => apiClient.get(`${STATS_API_END_POINT}/public`),
};
