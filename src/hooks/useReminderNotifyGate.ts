"use client";

import { useCallback, useRef, useState } from "react";
import {
  canAskForNotifications,
  hasActiveNotifications,
  isNotificationDenied,
} from "@/lib/notifications-ready";
import { ensurePushSubscription } from "@/lib/push";

type PendingAction = () => void;

export function useReminderNotifyGate() {
  const [open, setOpen] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const pendingRef = useRef<PendingAction | null>(null);

  const blocked = isNotificationDenied();

  const close = useCallback(() => {
    setOpen(false);
    pendingRef.current = null;
  }, []);

  const runPending = useCallback(() => {
    const action = pendingRef.current;
    pendingRef.current = null;
    setOpen(false);
    action?.();
  }, []);

  /** If alerts are already on, runs `action` immediately. Otherwise opens the prompt. */
  const gate = useCallback((action: PendingAction) => {
    if (hasActiveNotifications()) {
      action();
      return;
    }
    if (!canAskForNotifications() && !isNotificationDenied()) {
      action();
      return;
    }
    pendingRef.current = action;
    setOpen(true);
  }, []);

  const turnOn = useCallback(async () => {
    if (blocked) return;
    setEnabling(true);
    try {
      await ensurePushSubscription();
    } finally {
      setEnabling(false);
    }
    runPending();
  }, [blocked, runPending]);

  const inAppOnly = useCallback(() => {
    runPending();
  }, [runPending]);

  return {
    promptOpen: open,
    blocked,
    enabling,
    close,
    gate,
    turnOn,
    inAppOnly,
  };
}
