"use client";

import { IonButton, IonIcon, IonLabel, IonSegment, IonSegmentButton } from "@ionic/react";
import { moonOutline, sunnyOutline } from "ionicons/icons";
import { useTheme, type Theme } from "@/context/ThemeContext";

interface ThemeToggleProps {
  /** Compact sun/moon button (header) */
  iconOnly?: boolean;
  /** Light / Dark segment control (auth & settings) */
  variant?: "icon" | "segment";
}

export function ThemeToggle({ iconOnly, variant = "icon" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  if (variant === "segment") {
    return (
      <IonSegment
        value={theme}
        onIonChange={(e) => setTheme(e.detail.value as Theme)}
        style={{ maxWidth: 220 }}
      >
        <IonSegmentButton value="dark">
          <IonIcon icon={moonOutline} />
          <IonLabel>Dark</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value="light">
          <IonIcon icon={sunnyOutline} />
          <IonLabel>Light</IonLabel>
        </IonSegmentButton>
      </IonSegment>
    );
  }

  return (
    <IonButton
      fill="clear"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light" : "Switch to dark"}
    >
      <IonIcon icon={isDark ? sunnyOutline : moonOutline} slot={iconOnly ? "icon-only" : "start"} />
      {!iconOnly && <span>{isDark ? "Light" : "Dark"}</span>}
    </IonButton>
  );
}
