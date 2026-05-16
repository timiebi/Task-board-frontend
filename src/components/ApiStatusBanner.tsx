"use client";

import { useEffect, useState } from "react";
import { IonToast } from "@ionic/react";
import { onApiStatus } from "@/lib/api";

export function ApiStatusBanner() {
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const unsubscribe = onApiStatus((ok, error) => {
      if (!ok && error) {
        setIsError(true);
        setMessage(error);
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <IonToast
      isOpen={!!message}
      message={message ?? ""}
      duration={4000}
      color={isError ? "danger" : "success"}
      onDidDismiss={() => setMessage(null)}
      position="top"
    />
  );
}
