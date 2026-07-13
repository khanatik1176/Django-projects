import type { User } from "./types";

const ACCESS_KEY = "ims_access_token";
const REFRESH_KEY = "ims_refresh_token";
const USER_KEY = "ims_user";

export const authStorage = {
  getAccessToken: () =>
    typeof window !== "undefined" ? localStorage.getItem(ACCESS_KEY) : null,

  getRefreshToken: () =>
    typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null,

  getUser: (): User | null => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  },

  setSession: (access: string, refresh: string, user: User) => {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },

  isAuthenticated: () => !!authStorage.getAccessToken(),
};
