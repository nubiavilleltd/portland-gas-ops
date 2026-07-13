import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from "axios";
import { API_URL } from "./constants";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send HTTP-only cookies automatically
  headers: { "Content-Type": "application/json" },
});


// ─── Request interceptor — attach Bearer token ────────────────────────────────
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // Dynamically import to avoid SSR issues
  console.log("API base URL:", API_URL, api);
  console.log("REQUEST", {     baseURL: config.baseURL,     url: config.url,     full: `${config.baseURL}${config.url}`,   });
  if (typeof window !== "undefined") {
    const { useAuthStore } = await import("@/store/authStore");
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
      console.log("Attached Bearer token to request:", token);
    }

    console.log("token in request interceptor:", token);
  }
  return config;
});

// ─── Response interceptor — silent refresh on 401 ────────────────────────────
let isRefreshing = false;
let isRedirectingToLogin = false;   // guard: only one logout+redirect per session
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Only skip the refresh flow for endpoints that must NOT trigger a refresh
    // (login/refresh/logout). Other /api/auth/ endpoints like /api/auth/me CAN trigger it.
    const skipRefresh = ["/api/auth/login", "/api/auth/refresh", "/api/auth/logout"].some(
      (path) => originalRequest.url?.includes(path)
    );
    if (error.response?.status === 401 && !originalRequest._retry && !skipRefresh) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch(Promise.reject.bind(Promise));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // refresh_token is sent automatically via withCredentials (HTTP-only cookie)
        const { data } = await axios.post(
          `${API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        console.log("Refresh token:", data)

        if(!data.access_token){
          console.error("No access token received during refresh.");
        }

        const newToken: string = data.access_token;

        // Persist new token
        const { saveTokens } = await import("./auth");
        await saveTokens(newToken);

        processQueue(null, newToken);

        if (originalRequest.headers) {
          originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      } catch (refreshError: any) {
        processQueue(refreshError, null);

        const refreshStatus = refreshError?.response?.status;

        // Only clear session + redirect on a real auth failure (401).
        // A 429 rate-limit means the token is still valid — do NOT redirect,
        // just let React Query surface the error naturally.
        if (refreshStatus === 401 && !isRedirectingToLogin) {
          isRedirectingToLogin = true;
          const { clearTokens } = await import("./auth");
          await clearTokens();
          // Call logout to delete the HTTP-only refresh_token cookie.
          // Without this the cookie persists and middleware keeps redirecting to /
          // instead of allowing the login page to show.
          try {
            await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
          } catch {
            // ignore — we're logging out regardless
          }
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Typed helpers ─────────────────────────────────────────────────────────────
export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await api.get<T>(url, { params });
  console.log("response from get:", res.data, url);
  return res.data;
}

export async function post<T>(url: string, data?: unknown): Promise<T> {
  const res = await api.post<T>(url, data);
  return res.data;
}

export async function put<T>(url: string, data?: unknown): Promise<T> {
  const res = await api.put<T>(url, data);
  return res.data;
}

export async function patch<T>(url: string, data?: unknown): Promise<T> {
  const res = await api.patch<T>(url, data);
  return res.data;
}

export async function del<T>(url: string): Promise<T> {
  const res = await api.delete<T>(url);
  return res.data;
}

/**
 * Send a multipart/form-data POST (for endpoints that accept file uploads).
 * Axios automatically sets Content-Type: multipart/form-data when passed a FormData object.
 */
export async function postForm<T>(url: string, formData: FormData): Promise<T> {
  const res = await api.post<T>(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function patchForm<T>(url: string, formData: FormData): Promise<T> {
  const res = await api.patch<T>(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export default api;
