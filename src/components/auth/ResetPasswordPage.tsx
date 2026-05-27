"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { IonContent, IonPage, IonSpinner } from "@ionic/react";
import { AuthPasswordInput } from "@/components/auth/AuthPasswordInput";
import { api, ApiError } from "@/lib/api";
import { USER_MESSAGES } from "@/lib/user-messages";
import "@/app/auth.css";

export function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";
  const linkValid = useMemo(() => Boolean(uid && token), [uid, token]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkValid || submitting) return;
    if (password.length < 8) {
      setError("Use a password at least 8 characters long.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const res = await api.auth.confirmPasswordReset({ uid, token, password });
      setSuccess(res.detail);
      setPassword("");
      setConfirm("");
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
              <h1>Choose a new password</h1>
              <p>Enter a new password for your account.</p>
            </header>

            <div className="auth-surface">
              {!linkValid ? (
                <div className="auth-form">
                  <p className="auth-error" role="alert">
                    This reset link is missing or invalid. Request a new one from the sign-in
                    page.
                  </p>
                  <p className="auth-footer">
                    <Link href="/forgot-password">Request reset link</Link>
                    {" · "}
                    <Link href="/">Sign in</Link>
                  </p>
                </div>
              ) : (
                <form className="auth-form" onSubmit={submit}>
                  <div className="auth-field">
                    <label className="label" htmlFor="reset-password">
                      New password
                    </label>
                    <AuthPasswordInput
                      id="reset-password"
                      value={password}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      onChange={setPassword}
                    />
                  </div>
                  <div className="auth-field">
                    <label className="label" htmlFor="reset-confirm">
                      Confirm password
                    </label>
                    <AuthPasswordInput
                      id="reset-confirm"
                      value={confirm}
                      placeholder="Same as above"
                      autoComplete="new-password"
                      onChange={setConfirm}
                    />
                  </div>

                  {error && (
                    <p className="auth-error" role="alert">
                      {error}
                    </p>
                  )}
                  {success && (
                    <p className="auth-success" role="status">
                      {success}{" "}
                      <Link href="/">Sign in</Link>
                    </p>
                  )}

                  <button
                    type="submit"
                    className="btn-primary auth-submit"
                    disabled={submitting || !password || !confirm}
                  >
                    {submitting ? (
                      <IonSpinner name="crescent" className="auth-spinner" />
                    ) : (
                      "Update password"
                    )}
                  </button>

                  <p className="auth-footer">
                    <Link href="/forgot-password">Send another link</Link>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
