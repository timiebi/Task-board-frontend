"use client";

import Link from "next/link";
import { useState } from "react";
import { IonContent, IonIcon, IonPage, IonSpinner } from "@ionic/react";
import { checkmarkCircleOutline, lockClosedOutline, personOutline } from "ionicons/icons";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { USER_MESSAGES } from "@/lib/user-messages";
import "@/app/auth.css";

export function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!username.trim() || !password || submitting) return;
    setError("");
    setSubmitting(true);
    try {
      if (mode === "login") await login(username.trim(), password);
      else await register(username.trim(), password, email.trim() || undefined);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : USER_MESSAGES.generic);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <IonPage className="auth-page">
      <IonContent fullscreen className="auth-ion-content">
        <div className="auth-screen">
          <div className="auth-shell">
            <header className="auth-brand">
              <div className="auth-logo" aria-hidden>
                ✓
              </div>
              <h1>Task Board</h1>
              <p>Tasks, notes, plans, reminders</p>
            </header>

            <div className="auth-surface">
              <div className="auth-surface-header">
                <div className="pill-group auth-tabs" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "login"}
                    className={`pill ${mode === "login" ? "pill-active" : ""}`}
                    onClick={() => {
                      setMode("login");
                      setError("");
                    }}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "register"}
                    className={`pill ${mode === "register" ? "pill-active" : ""}`}
                    onClick={() => {
                      setMode("register");
                      setError("");
                    }}
                  >
                    Register
                  </button>
                </div>
              </div>

              <form className="auth-form" onSubmit={submit}>
                <div className="auth-field">
                  <label className="label" htmlFor="auth-username">
                    Username
                  </label>
                  <div className="auth-input-wrap">
                    <IonIcon icon={personOutline} className="auth-input-icon" aria-hidden />
                    <input
                      id="auth-username"
                      className="input auth-input"
                      value={username}
                      placeholder="yourname"
                      autoComplete="username"
                      autoCapitalize="none"
                      onChange={(ev) => setUsername(ev.target.value)}
                    />
                  </div>
                </div>

                {mode === "register" && (
                  <div className="auth-field">
                    <label className="label" htmlFor="auth-email">
                      Email <span className="auth-optional">recommended</span>
                    </label>
                    <div className="auth-input-wrap">
                      <IonIcon
                        icon={checkmarkCircleOutline}
                        className="auth-input-icon"
                        aria-hidden
                      />
                      <input
                        id="auth-email"
                        type="email"
                        className="input auth-input"
                        value={email}
                        placeholder="you@email.com"
                        autoComplete="email"
                        onChange={(ev) => setEmail(ev.target.value)}
                      />
                    </div>
                  </div>
                )}

                {mode === "login" && (
                  <p className="auth-forgot">
                    <Link href="/forgot-password">Forgot password?</Link>
                  </p>
                )}

                <div className="auth-field">
                  <label className="label" htmlFor="auth-password">
                    Password
                  </label>
                  <div className="auth-input-wrap">
                    <IonIcon icon={lockClosedOutline} className="auth-input-icon" aria-hidden />
                    <input
                      id="auth-password"
                      type="password"
                      className="input auth-input"
                      value={password}
                      placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      onChange={(ev) => setPassword(ev.target.value)}
                    />
                  </div>
                </div>

                {error && (
                  <p className="auth-error" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn-primary auth-submit"
                  disabled={submitting || !username.trim() || !password}
                >
                  {submitting ? (
                    <IonSpinner name="crescent" className="auth-spinner" />
                  ) : mode === "login" ? (
                    "Sign in"
                  ) : (
                    "Create account"
                  )}
                </button>

                <p className="auth-footer">
                  {mode === "login"
                    ? "No account? Switch to Register above."
                    : "Already have an account? Switch to Sign in."}
                </p>
              </form>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
