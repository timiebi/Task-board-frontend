"use client";

import Link from "next/link";
import { useState } from "react";
import { IonContent, IonIcon, IonPage, IonSpinner } from "@ionic/react";
import { mailOutline } from "ionicons/icons";
import { api, ApiError } from "@/lib/api";
import { USER_MESSAGES } from "@/lib/user-messages";
import "@/app/auth.css";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const res = await api.auth.requestPasswordReset(email.trim());
      setSuccess(res.detail);
      setEmail("");
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
              <h1>Reset password</h1>
              <p>We&apos;ll email you a link if that address is on your account.</p>
            </header>

            <div className="auth-surface">
              <form className="auth-form" onSubmit={submit}>
                <div className="auth-field">
                  <label className="label" htmlFor="forgot-email">
                    Email
                  </label>
                  <div className="auth-input-wrap">
                    <IonIcon icon={mailOutline} className="auth-input-icon" aria-hidden />
                    <input
                      id="forgot-email"
                      type="email"
                      className="input auth-input"
                      value={email}
                      placeholder="you@email.com"
                      autoComplete="email"
                      required
                      onChange={(ev) => setEmail(ev.target.value)}
                    />
                  </div>
                </div>

                {error && (
                  <p className="auth-error" role="alert">
                    {error}
                  </p>
                )}
                {success && (
                  <p className="auth-success" role="status">
                    {success}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn-primary auth-submit"
                  disabled={submitting || !email.trim()}
                >
                  {submitting ? (
                    <IonSpinner name="crescent" className="auth-spinner" />
                  ) : (
                    "Send reset link"
                  )}
                </button>

                <p className="auth-footer">
                  <Link href="/">Back to sign in</Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
