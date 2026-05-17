"use client";

import { createContext, useContext, useMemo } from "react";
import type { Tab } from "@/lib/types";

interface NavigationContextValue {
  tab: Tab;
  navigate: (tab: Tab) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({
  tab,
  navigate,
  children,
}: NavigationContextValue & { children: React.ReactNode }) {
  const value = useMemo(() => ({ tab, navigate }), [tab, navigate]);
  return (
    <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
  );
}

export function useAppNavigate() {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error("useAppNavigate must be used within NavigationProvider");
  }
  return ctx;
}
