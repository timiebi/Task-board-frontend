"use client";

import { useCallback, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import {
  clearPendingInviteToken,
  getPendingInviteToken,
} from "@/lib/pending-invite";
import { useNotifications, useSharingMutations } from "@/hooks/queries";
import type { AppNotification } from "@/lib/types";

export async function flushPendingInvite() {
  const token = getPendingInviteToken();
  if (!token) return;
  try {
    await api.sharing.acceptToken(token);
    clearPendingInviteToken();
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    if (status === 401) return;
    clearPendingInviteToken();
  }
}

export function useAppNotifications(enabled: boolean) {
  const seen = useRef<Set<number>>(new Set());
  const { data: notifications = [] } = useNotifications();
  const { acceptFromNotification } = useSharingMutations();

  useEffect(() => {
    if (!enabled) return;
    void flushPendingInvite();
  }, [enabled]);

  const pushNotify = useCallback((n: AppNotification) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    if (seen.current.has(n.id)) return;
    seen.current.add(n.id);
    new Notification(n.title, {
      body: n.body || undefined,
      tag: `app-notification-${n.id}`,
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;
    for (const n of notifications) {
      if (!n.is_read) pushNotify(n);
    }
  }, [notifications, enabled, pushNotify]);

  return { acceptFromNotification };
}
