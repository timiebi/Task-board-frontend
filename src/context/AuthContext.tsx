"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useAuthMe } from "@/hooks/queries";
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
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hasToken, setHasToken] = useState(false);
  useEffect(() => {
    setHasToken(!!getToken());
  }, []);
  const { data: me, isLoading, isError } = useAuthMe(hasToken);

  useEffect(() => {
    if (!hasToken) {
      setUser(null);
      return;
    }
    const stored = getStoredUser();
    if (stored) setUser(stored);
  }, [hasToken]);

  useEffect(() => {
    if (me) setUser(me);
    if (isError) {
      clearAuth();
      setUser(null);
      queryClient.removeQueries({ queryKey: queryKeys.auth.me });
    }
  }, [me, isError, queryClient]);

  const loginMutation = useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      api.auth.login(username, password),
    onSuccess: (res) => {
      setAuth(res.token, res.user);
      setUser(res.user);
      queryClient.setQueryData(queryKeys.auth.me, res.user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: ({
      username,
      password,
      email,
    }: {
      username: string;
      password: string;
      email?: string;
    }) => api.auth.register(username, password, email),
    onSuccess: (res) => {
      setAuth(res.token, res.user);
      setUser(res.user);
      queryClient.setQueryData(queryKeys.auth.me, res.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.auth.logout(),
    onSettled: () => {
      clearAuth();
      setUser(null);
      queryClient.clear();
    },
  });

  const login = useCallback(
    async (username: string, password: string) => {
      await loginMutation.mutateAsync({ username, password });
    },
    [loginMutation]
  );

  const register = useCallback(
    async (username: string, password: string, email?: string) => {
      await registerMutation.mutateAsync({ username, password, email });
    },
    [registerMutation]
  );

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      clearAuth();
      setUser(null);
      queryClient.clear();
    }
  }, [logoutMutation, queryClient]);

  const loading = hasToken ? isLoading && !user : false;

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
