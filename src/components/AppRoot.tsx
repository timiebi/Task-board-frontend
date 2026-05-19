"use client";

import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { QueryProvider } from "@/providers/QueryProvider";
import { IonicProvider } from "./IonicProvider";
import { AppShell } from "./AppShell";
import { AppSplash } from "./AppSplash";
import { LoginPage } from "./LoginPage";
import { PwaRegister } from "./PwaRegister";

function useHideInitialSplash(active: boolean) {
  useEffect(() => {
    if (!active) return;
    if (typeof document === "undefined") return;
    const node = document.getElementById("initial-splash");
    if (!node) return;
    node.classList.add("app-splash--fading");
    const t = window.setTimeout(() => node.remove(), 220);
    return () => window.clearTimeout(t);
  }, [active]);
}

function AppGate() {
  const { user, loading } = useAuth();
  useHideInitialSplash(!loading);

  if (loading) return <AppSplash />;
  if (!user) return <LoginPage />;
  return <AppShell />;
}

export function AppRoot() {
  return (
    <IonicProvider>
      <PwaRegister />
      <QueryProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppGate />
          </AuthProvider>
        </ThemeProvider>
      </QueryProvider>
    </IonicProvider>
  );
}
