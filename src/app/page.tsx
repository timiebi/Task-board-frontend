"use client";

import dynamic from "next/dynamic";

const AppRoot = dynamic(
  () => import("@/components/AppRoot").then((m) => m.AppRoot),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0e14",
          color: "#8b9cb3",
        }}
      >
        Loading…
      </div>
    ),
  }
);

export default function Home() {
  return <AppRoot />;
}
