"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        reg.update().catch(() => {
          /* ignore network errors during background update */
        });
      } catch {
        /* offline-install is optional */
      }
    };

    void register();
  }, []);

  return null;
}
