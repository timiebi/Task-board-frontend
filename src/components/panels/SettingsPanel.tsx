"use client";

import { IonIcon } from "@ionic/react";
import { logOutOutline, moonOutline, sunnyOutline } from "ionicons/icons";
import { useAuth } from "@/context/AuthContext";
import { useTheme, type Theme } from "@/context/ThemeContext";
import { PageShell } from "../ui/PageShell";
import { SurfacePanel } from "../ui/SurfacePanel";

const themeOptions: { id: Theme; label: string; description: string; icon: string }[] = [
  {
    id: "light",
    label: "Light",
    description: "White background",
    icon: sunnyOutline,
  },
  {
    id: "dark",
    label: "Dark",
    description: "Dark background (default)",
    icon: moonOutline,
  },
];

export function SettingsPanel() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const initial = (user?.username?.[0] ?? "U").toUpperCase();

  return (
    <PageShell narrow title="Settings" subtitle="Account and theme">
      <SurfacePanel className="surface--sections">
        <section className="surface-section">
          <header className="surface-section-header">
            <h3>Profile</h3>
          </header>
          <div className="surface-section-body">
            <div className="settings-profile-card">
              <div className="settings-avatar" aria-hidden>
                {initial}
              </div>
              <div className="settings-profile-info">
                <p className="settings-profile-name">{user?.username}</p>
                <p className="settings-profile-email">
                  {user?.email || "No email added"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="surface-section">
          <header className="surface-section-header">
            <h3>Appearance</h3>
          </header>
          <div className="surface-section-body">
            <p className="surface-section-hint">Tap a theme to switch.</p>
            <div className="theme-picker">
              {themeOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`theme-option theme-option--${opt.id} ${
                    theme === opt.id ? "theme-option--active" : ""
                  }`}
                  onClick={() => setTheme(opt.id)}
                  aria-pressed={theme === opt.id}
                >
                  <div className="theme-option-preview">
                    <IonIcon icon={opt.icon} className="theme-option-icon" />
                  </div>
                  <span className="theme-option-label">{opt.label}</span>
                  <span className="theme-option-desc">{opt.description}</span>
                  {theme === opt.id && (
                    <span className="theme-option-check">Selected</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="surface-section">
          <header className="surface-section-header">
            <h3>Account</h3>
          </header>
          <div className="surface-section-body">
            <button type="button" className="settings-signout" onClick={() => logout()}>
              <IonIcon icon={logOutOutline} />
              Sign out
            </button>
          </div>
        </section>
      </SurfacePanel>
    </PageShell>
  );
}
