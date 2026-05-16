"use client";

import { IonSpinner } from "@ionic/react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { QueryProvider } from "@/providers/QueryProvider";
import { IonicProvider } from "./IonicProvider";
import { AppShell } from "./AppShell";
import { LoginPage } from "./LoginPage";
import { PwaRegister } from "./PwaRegister";

function AppGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IonSpinner name="crescent" />
      </div>
    );
  }

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
