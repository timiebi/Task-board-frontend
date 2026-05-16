"use client";

import { Calendar, CheckSquare, FileText, Map } from "lucide-react";
import { useDashboard } from "@/hooks/queries";
import { useAppNavigate } from "@/context/NavigationContext";
import { formatDateTime, isOverdue } from "@/lib/utils";
import { EmptyState } from "../ui/EmptyState";
import { PageShell } from "../ui/PageShell";
import { SurfacePanel } from "../ui/SurfacePanel";

export function DashboardPanel() {
  const { navigate } = useAppNavigate();
  const { data, isLoading: loading } = useDashboard();
  const tasks = data?.tasks ?? [];
  const notesCount = data?.notesCount ?? 0;
  const plans = data?.plans ?? [];
  const events = data?.events ?? [];

  const pendingTasks = tasks.filter((t) => !t.completed);
  const overdueCount = tasks.filter(
    (t) => !t.completed && isOverdue(t.due_date, t.completed)
  ).length;

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (loading) {
    return (
      <PageShell title="Dashboard" subtitle="Today">
        <SurfacePanel>
          <p className="surface-loading">Loading…</p>
        </SurfacePanel>
      </PageShell>
    );
  }

  return (
    <PageShell title="Dashboard" subtitle={dateLabel}>
      <div className="dash-stats">
        <DashStat
          icon={CheckSquare}
          label="Today's tasks"
          value={pendingTasks.length}
          onClick={() => navigate("tasks")}
        />
        <DashStat
          icon={CheckSquare}
          label="Overdue"
          value={overdueCount}
          alert={overdueCount > 0}
          onClick={() => navigate("tasks")}
        />
        <DashStat
          icon={FileText}
          label="Notes"
          value={notesCount}
          onClick={() => navigate("notes")}
        />
        <DashStat
          icon={Calendar}
          label="Upcoming"
          value={events.length}
          onClick={() => navigate("events")}
        />
      </div>

      <SurfacePanel className="surface--dashboard">
        <div className="dash-grid">
          <section className="dash-section">
            <button
              type="button"
              className="dash-section-header dash-section-header--link"
              onClick={() => navigate("tasks")}
            >
              <CheckSquare /> Today
            </button>
            <div className="dash-section-body">
              {pendingTasks.length === 0 ? (
                <p className="dash-empty">Nothing due today.</p>
              ) : (
                <ul className="surface-list" style={{ padding: 0 }}>
                  {pendingTasks.slice(0, 6).map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        className="dash-row dash-row--link"
                        onClick={() => navigate("tasks")}
                      >
                        <span
                          className={`dash-dot ${
                            isOverdue(t.due_date, t.completed) ? "is-overdue" : ""
                          }`}
                        />
                        <span>{t.title}</span>
                        {t.due_date && (
                          <span className="dash-row-time">
                            {formatDateTime(t.due_date)}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="dash-section">
            <button
              type="button"
              className="dash-section-header dash-section-header--link"
              onClick={() => navigate("plans")}
            >
              <Map /> Active plans
            </button>
            <div className="dash-section-body">
              {plans.length === 0 ? (
                <p className="dash-empty">No active plans.</p>
              ) : (
                <ul className="surface-list" style={{ padding: 0 }}>
                  {plans.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className="dash-row dash-row--link"
                        onClick={() => navigate("plans")}
                      >
                        <span className="font-medium" style={{ color: "var(--text)" }}>
                          {p.title}
                        </span>
                        {p.end_date && (
                          <span className="dash-row-time">by {p.end_date}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="dash-section dash-section--wide">
            <button
              type="button"
              className="dash-section-header dash-section-header--link"
              onClick={() => navigate("events")}
            >
              <Calendar /> Upcoming events
            </button>
            <div className="dash-section-body">
              {events.length === 0 ? (
                <EmptyState variant="calendar" compact />
              ) : (
                <div className="dash-event-grid">
                  {events.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      className="dash-event-card dash-event-card--link"
                      onClick={() => navigate("events")}
                    >
                      <strong>{e.title}</strong>
                      <span>{formatDateTime(e.starts_at)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </SurfacePanel>
    </PageShell>
  );
}

function DashStat({
  icon: Icon,
  label,
  value,
  alert,
  onClick,
}: {
  icon: typeof CheckSquare;
  label: string;
  value: number;
  alert?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`dash-stat dash-stat--link ${alert ? "is-alert" : ""}`}
      onClick={onClick}
      aria-label={`${label}: ${value}. Go to ${label.toLowerCase()}.`}
    >
      <Icon className="dash-stat-icon h-5 w-5" />
      <p className="dash-stat-value">{value}</p>
      <p className="dash-stat-label">{label}</p>
    </button>
  );
}
