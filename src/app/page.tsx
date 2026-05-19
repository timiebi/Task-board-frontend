"use client";

import dynamic from "next/dynamic";
import { AppSplash } from "@/components/AppSplash";

const AppRoot = dynamic(
  () => import("@/components/AppRoot").then((m) => m.AppRoot),
  {
    ssr: false,
    loading: () => <AppSplash />,
  }
);

export default function Home() {
  return <AppRoot />;
}
