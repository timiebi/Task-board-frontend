"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { api, ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useAuthMe } from "@/hooks/queries";
import {
  AuthUser,
  clearAuth,
  getStoredUser,
  getToken,
  onAuthChange,
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

function readHasToken() {
  return !!getToken();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    const tokenPresent = readHasToken();
    setHasToken(tokenPresent);
    if (tokenPresent) {
      const stored = getStoredUser();
      if (stored) setUser(stored);
    }
    setBootstrapped(true);
  }, []);

  useEffect(() => {
    return onAuthChange(() => {
      const tokenPresent = readHasToken();
      setHasToken(tokenPresent);
      if (!tokenPresent) {
        setUser(null);
        queryClient.removeQueries({ queryKey: queryKeys.auth.me });
      }
    });
  }, [queryClient]);

  const { data: me, isLoading, error } = useAuthMe(hasToken);

  useEffect(() => {
    if (me) setUser(me);
  }, [me]);

  useEffect(() => {
    if (!error) return;
    if (error instanceof ApiError && error.status === 401) {
      clearAuth();
      setHasToken(false);
      setUser(null);
      queryClient.removeQueries({ queryKey: queryKeys.auth.me });
    }
  }, [error, queryClient]);

  const loginMutation = useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      api.auth.login(username, password),
    onSuccess: (res) => {
      setAuth(res.token, res.user);
      setHasToken(true);
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
      setHasToken(true);
      setUser(res.user);
      queryClient.setQueryData(queryKeys.auth.me, res.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.auth.logout(),
    onSettled: () => {
      clearAuth();
      setHasToken(false);
      setUser(null);
      queryClient.clear();
    },
  });

  const loginMutateRef = useRef(loginMutation.mutateAsync);
  loginMutateRef.current = loginMutation.mutateAsync;
  const registerMutateRef = useRef(registerMutation.mutateAsync);
  registerMutateRef.current = registerMutation.mutateAsync;
  const logoutMutateRef = useRef(logoutMutation.mutateAsync);
  logoutMutateRef.current = logoutMutation.mutateAsync;

  const login = useCallback(async (username: string, password: string) => {
    await loginMutateRef.current({ username, password });
  }, []);

  const register = useCallback(
    async (username: string, password: string, email?: string) => {
      await registerMutateRef.current({ username, password, email });
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await logoutMutateRef.current();
    } catch {
      clearAuth();
      setHasToken(false);
      setUser(null);
      queryClient.clear();
    }
  }, [queryClient]);

  // Wait until we've read localStorage before showing login (avoids flash on refresh).
  const loading = !bootstrapped || (hasToken && isLoading && !user);

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
