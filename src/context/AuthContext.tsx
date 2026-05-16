"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "@/lib/api";
import {
  AuthUser,
  clearAuth,
  getStoredUser,
  getToken,
  setAuth,
} from "@/lib/auth";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const stored = getStoredUser();
    if (!token || !stored) {
      setLoading(false);
      return;
    }
    setUser(stored);
    api.auth
      .me()
      .then((u) => setUser(u))
      .catch(() => {
        clearAuth();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.auth.login(username, password);
    setAuth(res.token, res.user);
    setUser(res.user);
  }, []);

  const register = useCallback(
    async (username: string, password: string, email?: string) => {
      const res = await api.auth.register(username, password, email);
      setAuth(res.token, res.user);
      setUser(res.user);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      /* token may already be invalid */
    }
    clearAuth();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
