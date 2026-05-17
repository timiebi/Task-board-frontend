"use client";

import { useCallback, useEffect, useRef } from "react";
import { useDueReminders, useEventMutations, useTaskMutations } from "@/hooks/queries";
import type { Event, Task } from "@/lib/types";

export function useReminders(enabled: boolean) {
  const notifiedEvents = useRef<Set<number>>(new Set());
  const notifiedTasks = useRef<Set<number>>(new Set());
  const { data } = useDueReminders(enabled);
  const { markNotified } = useEventMutations();
  const { markReminded } = useTaskMutations("today");

  const notifyEvent = useCallback(
    (event: Event) => {
      if (typeof window === "undefined" || !("Notification" in window)) return;
      if (Notification.permission !== "granted") return;
      if (notifiedEvents.current.has(event.id)) return;

      notifiedEvents.current.add(event.id);
      new Notification(event.title, {
        body:
          event.description ||
          `Starts ${new Date(event.starts_at).toLocaleString()}`,
        tag: `event-${event.id}`,
      });
      markNotified.mutate(event.id, {
        onError: () => notifiedEvents.current.delete(event.id),
      });
    },
    [markNotified]
  );

  const notifyTask = useCallback(
    (task: Task) => {
      if (typeof window === "undefined" || !("Notification" in window)) return;
      if (Notification.permission !== "granted") return;
      if (notifiedTasks.current.has(task.id)) return;

      notifiedTasks.current.add(task.id);
      new Notification(task.title, {
        body: task.description || "This task is due now.",
        tag: `task-${task.id}`,
      });
      markReminded.mutate(task.id, {
        onError: () => notifiedTasks.current.delete(task.id),
      });
    },
    [markReminded]
  );

  useEffect(() => {
    if (!enabled || !data) return;
    for (const event of data.events) notifyEvent(event);
    for (const task of data.tasks) notifyTask(task);
  }, [data, enabled, notifyEvent, notifyTask]);

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
