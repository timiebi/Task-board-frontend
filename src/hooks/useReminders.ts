"use client";

import { useCallback, useEffect, useRef } from "react";
import { useDueReminders, useEventMutations } from "@/hooks/queries";
import type { Event } from "@/lib/types";

export function useReminders(enabled: boolean) {
  const notifiedRef = useRef<Set<number>>(new Set());
  const { data: due = [] } = useDueReminders(enabled);
  const { markNotified } = useEventMutations();

  const showNotification = useCallback(
    (event: Event) => {
      if (typeof window === "undefined" || !("Notification" in window)) return;
      if (Notification.permission !== "granted") return;
      if (notifiedRef.current.has(event.id)) return;

      notifiedRef.current.add(event.id);
      new Notification(`Reminder: ${event.title}`, {
        body:
          event.description ||
          `Starts ${new Date(event.starts_at).toLocaleString()}`,
        tag: `event-${event.id}`,
      });
      markNotified.mutate(event.id, {
        onError: () => {
          notifiedRef.current.delete(event.id);
        },
      });
    },
    [markNotified]
  );

  useEffect(() => {
    if (!enabled || !due.length) return;
    for (const event of due) {
      showNotification(event);
    }
  }, [due, enabled, showNotification]);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported" as const;
    }
    if (Notification.permission === "granted") return "granted" as const;
    if (Notification.permission === "denied") return "denied" as const;
    return Notification.requestPermission();
  }, []);

  return { requestPermission };
}
