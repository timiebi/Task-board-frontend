"use client";

import { useCallback, useEffect, useState } from "react";
import {
  disablePushSubscription,
  ensurePushSubscription,
  getCurrentPushState,
  isPushSupported,
  type PushState,
} from "@/lib/push";

export function usePush() {
  const [state, setState] = useState<PushState>("default");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getCurrentPushState().then((s) => {
      if (!cancelled) setState(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = useCallback(async () => {
    if (busy) return state;
    setBusy(true);
    try {
      const next = await ensurePushSubscription();
      setState(next);
      return next;
    } finally {
      setBusy(false);
    }
  }, [busy, state]);

  const disable = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await disablePushSubscription();
      setState("default");
    } finally {
      setBusy(false);
    }
  }, [busy]);

  return {
    supported: isPushSupported(),
    state,
    busy,
    enable,
    disable,
  };
}
