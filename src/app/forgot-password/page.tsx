"use client";

import dynamic from "next/dynamic";
import { AppSplash } from "@/components/AppSplash";

const ForgotPasswordPage = dynamic(
  () =>
    import("@/components/auth/ForgotPasswordPage").then((m) => m.ForgotPasswordPage),
  { ssr: false, loading: () => <AppSplash /> }
);

export default function ForgotPasswordRoute() {
  return <ForgotPasswordPage />;
}
