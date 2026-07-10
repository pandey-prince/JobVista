import apiClient from "./client";
import {
  USER_API_END_POINT,
  SAVED_JOBS_API_END_POINT,
  ALERTS_API_END_POINT,
  TRACKED_APPLICATIONS_API_END_POINT,
  JOB_API_END_POINT,
  CAREER_SOURCE_API_END_POINT,
  STATS_API_END_POINT,
  APPLICATION_API_END_POINT,
  SCRAPED_JOB_API_END_POINT,
} from "@/utils/constant";

export const authApi = {
  me: () => apiClient.get(`${USER_API_END_POINT}/me`),
  login: (payload) => apiClient.post(`${USER_API_END_POINT}/login`, payload),
  register: (payload) => apiClient.post(`${USER_API_END_POINT}/register`, payload),
  logout: () => apiClient.post(`${USER_API_END_POINT}/logout`),
};

export const savedJobsApi = {
  list: () => apiClient.get(`${SAVED_JOBS_API_END_POINT}/`),
  keys: () => apiClient.get(`${SAVED_JOBS_API_END_POINT}/keys`),
  save: (payload) => apiClient.post(`${SAVED_JOBS_API_END_POINT}/`, payload),
  remove: (jobKey) =>
    apiClient.delete(`${SAVED_JOBS_API_END_POINT}/${encodeURIComponent(jobKey)}`),
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
  list: (keyword = "") => apiClient.get(`${JOB_API_END_POINT}/get`, { params: { keyword } }),
  getById: (id) => apiClient.get(`${JOB_API_END_POINT}/get/${id}`),
  getScrapedById: (id) => apiClient.get(`${SCRAPED_JOB_API_END_POINT}/${id}`),
  matchScore: (jobKey) => apiClient.post(`${JOB_API_END_POINT}/match-score`, { jobKey }),
};

export const applicationsApi = {
  apply: (jobId) => apiClient.get(`${APPLICATION_API_END_POINT}/apply/${jobId}`),
};

export const careerSourceApi = {
  listPublic: () => apiClient.get(`${CAREER_SOURCE_API_END_POINT}/`),
  listUserLists: (type) =>
    apiClient.get(`${CAREER_SOURCE_API_END_POINT}/lists`, { params: { type } }),
  listWatchlistJobs: () =>
    apiClient.get(`${CAREER_SOURCE_API_END_POINT}/lists/jobs`, { params: { type: "watchlist" } }),
  submit: (payload) => apiClient.post(`${CAREER_SOURCE_API_END_POINT}/submit`, payload),
  addList: (payload) => apiClient.post(`${CAREER_SOURCE_API_END_POINT}/lists`, payload),
  updateList: (id, payload) =>
    apiClient.patch(`${CAREER_SOURCE_API_END_POINT}/lists/${id}`, payload),
  removeList: (id) => apiClient.delete(`${CAREER_SOURCE_API_END_POINT}/lists/${id}`),
};

export const statsApi = {
  public: () => apiClient.get(`${STATS_API_END_POINT}/public`),
};
