import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { authStorage } from "../auth-storage";
import type { ApiResponse } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

const processQueue = (token: string) => {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
};

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = authStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const refresh = authStorage.getRefreshToken();
    if (!refresh) {
      authStorage.clear();
      if (typeof window !== "undefined") window.location.href = "/login";
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(apiClient(original));
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post<{ access: string }>(
        `${API_URL}/accounts/token/refresh/`,
        { refresh },
      );

      const newAccess = data.access;
      const user = authStorage.getUser();
      if (user) {
        authStorage.setSession(newAccess, refresh, user);
      }

      processQueue(newAccess);
      original.headers.Authorization = `Bearer ${newAccess}`;
      return apiClient(original);
    } catch {
      authStorage.clear();
      if (typeof window !== "undefined") window.location.href = "/login";
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

export function getErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    const data = error.response?.data;
    if (data?.errors && typeof data.errors === "object") {
      const first = Object.values(data.errors)[0];
      if (Array.isArray(first) && first.length) return String(first[0]);
      if (typeof first === "string") return first;
    }
    if (data?.message) return String(data.message);
  }
  return fallback;
}
