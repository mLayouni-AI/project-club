import axios from "axios";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");

const ACCESS_KEY = "myclub.access";
const REFRESH_KEY = "myclub.refresh";

export function saveTokens({ access, refresh }) {
  if (access) sessionStorage.setItem(ACCESS_KEY, access);
  if (refresh) sessionStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
}

export function hasSessionToken() {
  return Boolean(sessionStorage.getItem(ACCESS_KEY) || sessionStorage.getItem(REFRESH_KEY));
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(ACCESS_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshInFlight;

async function refreshAccessToken() {
  const refresh = sessionStorage.getItem(REFRESH_KEY);
  if (!refresh) throw new Error("Session expirée.");
  const { data } = await axios.post(`${API_BASE_URL}/auth/refresh/`, { refresh }, { timeout: 15000 });
  saveTokens(data);
  return data.access;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const authRequest = /\/auth\/(login|signup|refresh)\//.test(request?.url || "");
    if (error.response?.status !== 401 || !request || request._retry || authRequest) {
      return Promise.reject(error);
    }

    request._retry = true;
    try {
      refreshInFlight ||= refreshAccessToken().finally(() => { refreshInFlight = null; });
      const token = await refreshInFlight;
      request.headers.Authorization = `Bearer ${token}`;
      return api(request);
    } catch (refreshError) {
      clearTokens();
      window.dispatchEvent(new Event("myclub:session-expired"));
      return Promise.reject(refreshError);
    }
  },
);

const list = (response) => response.data.results || response.data;

export const authAPI = {
  signup: (userData) => api.post("/auth/signup/", userData),
  login: (credentials) => api.post("/auth/login/", credentials),
  refresh: (refresh) => api.post("/auth/refresh/", { refresh }),
  logout: (refresh) => api.post("/auth/logout/", { refresh }),
  me: () => api.get("/auth/me/"),
  updateMe: (data) => api.patch("/auth/me/", data),
  changePassword: (data) => api.post("/auth/password/change/", data),
  requestPasswordReset: (email) => api.post("/auth/password/reset/", { email }),
  confirmPasswordReset: (data) => api.post("/auth/password/reset/confirm/", data),
};

export const membersAPI = {
  getAll: (params) => api.get("/members/", { params }),
  getById: (id) => api.get(`/members/${id}/`),
  deactivate: (id) => api.post(`/members/${id}/deactivate/`),
  activate: (id) => api.post(`/members/${id}/activate/`),
  assignRoles: (id, roles) => api.post(`/members/${id}/roles/`, { roles }),
  export: (params) => api.get("/members/export/", { params, responseType: "blob" }),
};

export const membershipAPI = {
  getAll: async (params) => list(await api.get("/membership-requests/", { params })),
  getMine: () => api.get("/membership-requests/mine/"),
  create: (data) => api.post("/membership-requests/", data),
  review: (id, data) => api.post(`/membership-requests/${id}/review/`, data),
};

export const projectsAPI = {
  getAll: async (params) => list(await api.get("/projects/", { params })),
  getById: (id) => api.get(`/projects/${id}/`),
  create: (data) => api.post("/projects/", data),
  update: (id, data) => api.patch(`/projects/${id}/`, data),
  delete: (id) => api.delete(`/projects/${id}/`),
  dashboard: (id) => api.get(`/projects/${id}/dashboard/`),
  tasks: async (params) => (await api.get("/tasks/", { params })).data,
  createTask: (data) => api.post("/tasks/", data),
  updateTask: (id, data) => api.patch(`/tasks/${id}/`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}/`),
  getTaskComments: async (taskId) => list(await api.get("/task-comments/", { params: { task: taskId } })),
  addTaskComment: (taskId, data) => api.post(`/tasks/${taskId}/comments/`, data),
  getMilestones: async (projectId) => list(await api.get("/milestones/", { params: { project: projectId } })),
  createMilestone: (projectId, data) => api.post("/milestones/", { ...data, project: projectId }),
  deleteMilestone: (projectId, id) => api.delete(`/milestones/${id}/`),
  completeMilestone: (id) => api.post(`/milestones/${id}/complete/`),
  reopenMilestone: (id) => api.post(`/milestones/${id}/reopen/`),
  getMemberships: async (projectId) => list(await api.get("/project-memberships/", { params: { project: projectId } })),
  getMembershipCandidates: async (projectId) => list(await api.get("/project-memberships/candidates/", { params: { project: projectId } })),
  addMembership: (projectId, data) => api.post("/project-memberships/", { ...data, project: projectId }),
  removeMembership: (projectId, id) => api.delete(`/project-memberships/${id}/`),
  getFiles: async (projectId) => list(await api.get("/project-files/", { params: { project: projectId } })),
  uploadFile: (projectId, file, taskId) => {
    const formData = new FormData();
    formData.append("project", projectId);
    formData.append("file", file);
    if (taskId) formData.append("task", taskId);
    return api.post("/project-files/", formData, { headers: { "Content-Type": "multipart/form-data" } });
  },
  downloadFile: (id) => api.get(`/project-files/${id}/download/`, { responseType: "blob" }),
  deleteFile: (projectId, id) => api.delete(`/project-files/${id}/`),
};

export const eventsAPI = {
  getAll: async (params) => list(await api.get("/events/", { params })),
  getById: (id) => api.get(`/events/${id}/`),
  create: (data) => api.post("/events/", data),
  update: (id, data) => api.patch(`/events/${id}/`, data),
  register: (id) => api.post(`/events/${id}/register/`),
  cancelRegistration: (id) => api.post(`/events/${id}/cancel_registration/`),
  participants: (id) => api.get(`/events/${id}/participants/`),
  exportParticipants: (id) => api.get(`/events/${id}/export_participants/`, { responseType: "blob" }),
  attendance: (id, data) => data ? api.post(`/events/${id}/attendance/`, data) : api.get(`/events/${id}/attendance/`),
};

export const announcementsAPI = {
  getAll: async (params) => list(await api.get("/announcements/", { params })),
  create: (data) => api.post("/announcements/", data),
  update: (id, data) => api.patch(`/announcements/${id}/`, data),
  delete: (id) => api.delete(`/announcements/${id}/`),
  publish: (id) => api.post(`/announcements/${id}/publish/`),
  unpublish: (id) => api.post(`/announcements/${id}/unpublish/`),
};

export const notificationsAPI = {
  getAll: async (params) => list(await api.get("/notifications/", { params })),
  markRead: (id) => api.post(`/notifications/${id}/mark_read/`),
  markAllRead: () => api.post("/notifications/mark_all_read/"),
};

export const dashboardAPI = {
  summary: () => api.get("/dashboard/summary/"),
};

export const auditAPI = {
  getAll: (params) => api.get("/audit-logs/", { params }),
};

export function errorMessage(error, fallback = "Une erreur est survenue.") {
  const data = error?.response?.data;
  if (typeof data?.detail === "string") return data.detail;
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const first = Object.values(data).flat(Infinity).find((value) => typeof value === "string");
    if (first) return first;
  }
  return error?.message || fallback;
}

export default api;
