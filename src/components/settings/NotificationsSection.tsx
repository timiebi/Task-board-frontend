"use client";

import { BellOff, BellRing, Download, Smartphone } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { usePush } from "@/hooks/usePush";
import { Button } from "../ui/Button";

export function NotificationsSection() {
  const { supported, state, busy, enable, disable } = usePush();
  const { canInstall, installed, promptInstall } = useInstallPrompt();

  const renderPushBody = () => {
    if (!supported) {
      return (
        <p className="surface-section-hint">
          This browser doesn't support push notifications. Use Chrome, Edge, or
          install the app to your home screen.
        </p>
      );
    }
    if (state === "denied") {
      return (
        <p className="surface-section-hint">
          Notifications are blocked for this site. Open your browser settings,
          allow notifications for this URL, then come back.
        </p>
      );
    }
    if (state === "subscribed") {
      return (
        <>
          <p className="surface-section-hint">
            You'll get a push for task reminders, event alerts, and anything
            people share with you — even when this tab is closed.
          </p>
          <Button type="button" variant="ghost" loading={busy} onClick={() => void disable()}>
            <BellOff className="h-4 w-4" /> Turn off on this device
          </Button>
        </>
      );
    }
    return (
      <>
        <p className="surface-section-hint">
          Turn on push notifications so reminders reach you even when the app
          isn't open.
        </p>
        <Button type="button" loading={busy} onClick={() => void enable()}>
          <BellRing className="h-4 w-4" /> Enable push notifications
        </Button>
      </>
    );
  };

  return (
    <section className="surface-section">
      <header className="surface-section-header">
        <h3>Notifications &amp; install</h3>
      </header>
      <div className="surface-section-body settings-stack">
        <div className="settings-stack-item">
          <h4 className="settings-stack-title">
            <BellRing className="h-4 w-4" /> Push notifications
          </h4>
          {renderPushBody()}
        </div>

        <div className="settings-stack-item">
          <h4 className="settings-stack-title">
            <Smartphone className="h-4 w-4" /> Install on this device
          </h4>
          {installed ? (
            <p className="surface-section-hint">
              You're already running the installed app. Notifications behave
              like a native app from here.
            </p>
          ) : canInstall ? (
            <>
              <p className="surface-section-hint">
                Add Task Board to your home screen for a faster, distraction-
                free experience and reliable background notifications.
              </p>
              <Button type="button" onClick={() => void promptInstall()}>
                <Download className="h-4 w-4" /> Install app
              </Button>
            </>
          ) : (
            <p className="surface-section-hint">
              Use your browser's <em>Add to Home Screen</em> or <em>Install
              app</em> menu to install this PWA. (Safari on iOS: Share →
              <em> Add to Home Screen</em>.)
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
