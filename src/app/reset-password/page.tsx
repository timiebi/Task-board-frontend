"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { AppSplash } from "@/components/AppSplash";

const ResetPasswordPage = dynamic(
  () =>
    import("@/components/auth/ResetPasswordPage").then((m) => m.ResetPasswordPage),
  { ssr: false, loading: () => <AppSplash /> }
);

export default function ResetPasswordRoute() {
  return (
    <Suspense fallback={<AppSplash />}>
      <ResetPasswordPage />
    </Suspense>
  );
}
