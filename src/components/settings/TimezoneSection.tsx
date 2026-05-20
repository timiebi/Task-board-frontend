"use client";

import { useQuery } from "@tanstack/react-query";
import { Globe } from "lucide-react";
import { api } from "@/lib/api";

function browserTimezone(): string {
  if (typeof Intl === "undefined") return "unknown";
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown";
}

export function TimezoneSection() {
  const browserTz = browserTimezone();
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["time-context", browserTz],
    queryFn: () => api.timeContext(),
    staleTime: 60_000,
  });

  const sourceLabel =
    data?.source === "client"
      ? "Using your device timezone"
      : data?.source === "invalid_fallback"
        ? "Invalid timezone header — using server default"
        : "Using server default timezone";

  return (
    <section className="surface-section">
      <header className="surface-section-header">
        <h3>
          <Globe className="inline h-4 w-4" aria-hidden /> Date &amp; time
        </h3>
      </header>
      <div className="surface-section-body settings-stack">
        <p className="surface-section-hint">
          &quot;Today&quot; on Home and Tasks follows your device timezone automatically when you
          travel.
        </p>
        <dl className="settings-tz-dl">
          <div>
            <dt>Your device</dt>
            <dd>{browserTz}</dd>
          </div>
          {isLoading ? (
            <p className="surface-section-hint">Checking server…</p>
          ) : isError ? (
            <p className="surface-section-hint">Could not reach the server for timezone info.</p>
          ) : data ? (
            <>
              <div>
                <dt>Server uses</dt>
                <dd>{data.effective_timezone}</dd>
              </div>
              <div>
                <dt>Today (for tasks)</dt>
                <dd>{data.today}</dd>
              </div>
              <div>
                <dt>Server clock</dt>
                <dd>{new Date(data.now).toLocaleString()}</dd>
              </div>
              <p className="surface-section-hint">{sourceLabel}</p>
            </>
          ) : null}
        </dl>
        <button
          type="button"
          className="btn-ghost text-sm"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          {isFetching ? "Refreshing…" : "Refresh timezone check"}
        </button>
      </div>
    </section>
  );
}
