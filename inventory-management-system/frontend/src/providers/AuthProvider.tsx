"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { authStorage } from "@/lib/auth-storage";
import { login as loginApi, logout as logoutApi } from "@/lib/api/auth";
import { LoadingState } from "@/components/ui/PageHeader";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Guest-only: logged-in users are redirected to the dashboard. */
const guestOnlyRoutes = ["/", "/login", "/register"];

function isGuestOnlyRoute(pathname: string) {
  return guestOnlyRoutes.includes(pathname);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = authStorage.getUser();
    setUser(stored);
    setLoading(false);

    const guestOnly = isGuestOnlyRoute(pathname);

    // Not logged in → block app routes (dashboard, etc.)
    if (!stored && !guestOnly) {
      setAllowed(false);
      router.replace("/login");
      return;
    }

    // Logged in → block landing, login, register
    if (stored && guestOnly) {
      setAllowed(false);
      router.replace("/dashboard");
      return;
    }

    setAllowed(true);
  }, [pathname, router]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await loginApi(email, password);
      authStorage.setSession(
        res.data.access_token,
        res.data.refresh_token,
        res.data.user,
      );
      setUser(res.data.user);
      router.push("/dashboard");
    },
    [router],
  );

  const logout = useCallback(async () => {
    const refresh = authStorage.getRefreshToken();
    try {
      if (refresh) await logoutApi(refresh);
    } finally {
      authStorage.clear();
      setUser(null);
      router.push("/");
    }
  }, [router]);

  const updateUser = useCallback((next: User) => {
    const access = authStorage.getAccessToken();
    const refresh = authStorage.getRefreshToken();
    if (access && refresh) {
      authStorage.setSession(access, refresh, next);
    }
    setUser(next);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, updateUser }),
    [user, loading, login, logout, updateUser],
  );

  if (loading || !allowed) {
    return (
      <AuthContext.Provider value={value}>
        <div className="flex min-h-dvh items-center justify-center bg-[#f4f6f3]">
          <LoadingState />
        </div>
      </AuthContext.Provider>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
