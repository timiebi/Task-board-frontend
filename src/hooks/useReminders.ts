"use client";

import { useCallback, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import type { Event } from "@/lib/types";

export function useReminders(enabled: boolean) {
  const notifiedRef = useRef<Set<number>>(new Set());

  const showNotification = useCallback((event: Event) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    if (notifiedRef.current.has(event.id)) return;

    notifiedRef.current.add(event.id);
    new Notification(`Reminder: ${event.title}`, {
      body: event.description || `Starts ${new Date(event.starts_at).toLocaleString()}`,
      tag: `event-${event.id}`,
    });
    api.events.markNotified(event.id).catch(() => {
      notifiedRef.current.delete(event.id);
    });
  }, []);

  const checkReminders = useCallback(async () => {
    if (!enabled) return;
    try {
      const due = await api.events.dueReminders();
      for (const event of due) {
        showNotification(event);
      }
    } catch {
      /* backend may be offline */
    }
  }, [enabled, showNotification]);

  useEffect(() => {
    if (!enabled) return;
    checkReminders();
    const id = setInterval(checkReminders, 30_000);
    return () => clearInterval(id);
  }, [enabled, checkReminders]);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported" as const;
    }
    if (Notification.permission === "granted") return "granted" as const;
    if (Notification.permission === "denied") return "denied" as const;
    const result = await Notification.requestPermission();
    return result;
  }, []);

  return { requestPermission, checkReminders };
}
