import axios from "axios";

const rawBaseUrl = import.meta.env.VITE_API_URL || "";
const apiBase = rawBaseUrl ? `${rawBaseUrl.replace(/\/$/, "")}/api` : "/api";

const api = axios.create({
  baseURL: apiBase,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor to attach Bearer token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("smartcms_token");
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for automatic refresh token handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not attempt refresh on auth endpoints (login, register, refresh)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/login") &&
      !originalRequest.url.includes("/auth/register") &&
      !originalRequest.url.includes("/auth/refresh")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshEndpoint = rawBaseUrl ? `${rawBaseUrl.replace(/\/$/, "")}/api/auth/refresh` : "/api/auth/refresh";
        const refreshRes = await axios.post(refreshEndpoint, {}, { withCredentials: true });
        const newToken = refreshRes.data?.data?.accessToken;
        if (newToken) {
          localStorage.setItem("smartcms_token", newToken);
          api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
        }
        processQueue(null, newToken);
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("smartcms_token");
        delete api.defaults.headers.common["Authorization"];
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
