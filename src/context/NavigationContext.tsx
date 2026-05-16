"use client";

import { createContext, useContext } from "react";
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
  return (
    <NavigationContext.Provider value={{ tab, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useAppNavigate() {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error("useAppNavigate must be used within NavigationProvider");
  }
  return ctx;
}
