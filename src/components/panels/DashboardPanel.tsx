"use client";

import { Calendar, CheckCircle2, CheckSquare, Map } from "lucide-react";
import { useDashboard } from "@/hooks/queries";
import { useAppNavigate } from "@/context/NavigationContext";
import { eventDisplayTime, formatDateTime, isOverdue } from "@/lib/utils";
import { EmptyState } from "../ui/EmptyState";
import { PageShell } from "../ui/PageShell";
import { SurfacePanel } from "../ui/SurfacePanel";

export function DashboardPanel() {
  const { navigate } = useAppNavigate();
  const { data, isLoading: loading } = useDashboard();
  const tasks = data?.tasks ?? [];
  const plans = data?.plans ?? [];
  const events = data?.events ?? [];

  const overdueTasks = tasks.filter(
    (t) => !t.completed && isOverdue(t.due_date, t.completed)
  );
  const activeTasks = tasks.filter(
    (t) => !t.completed && !isOverdue(t.due_date, t.completed)
  );
  const doneTasks = tasks.filter((t) => t.completed);

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
      <SurfacePanel className="surface--dashboard">
        <div className="dash-overview-strip" role="region" aria-label="Overview">
          <DashStat
            icon={CheckSquare}
            label="Tasks"
            value={activeTasks.length}
            onClick={() => navigate("tasks")}
          />
          <DashStat
            icon={CheckSquare}
            label="Overdue"
            value={overdueTasks.length}
            alert={overdueTasks.length > 0}
            onClick={() => navigate("tasks")}
          />
          <DashStat
            icon={CheckCircle2}
            label="Done"
            value={doneTasks.length}
            onClick={() => navigate("tasks")}
          />
          <DashStat
            icon={Calendar}
            label="Upcoming"
            value={events.length}
            onClick={() => navigate("events")}
          />
        </div>
        <div className="dash-grid">
          <section className="dash-section">
            <button
              type="button"
              className="dash-section-header dash-section-header--link"
              onClick={() => navigate("tasks")}
            >
              <CheckSquare /> Tasks
            </button>
            <div className="dash-section-body">
              {activeTasks.length === 0 ? (
                <p className="dash-empty">No active tasks right now.</p>
              ) : (
                <ul className="surface-list" style={{ padding: 0 }}>
                  {activeTasks.slice(0, 6).map((t) => (
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
              onClick={() => navigate("tasks")}
            >
              <CheckSquare /> Overdue
            </button>
            <div className="dash-section-body">
              {overdueTasks.length === 0 ? (
                <p className="dash-empty">Nothing overdue.</p>
              ) : (
                <ul className="surface-list" style={{ padding: 0 }}>
                  {overdueTasks.slice(0, 6).map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        className="dash-row dash-row--link"
                        onClick={() => navigate("tasks")}
                      >
                        <span className="dash-dot is-overdue" />
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
              onClick={() => navigate("tasks")}
            >
              <CheckCircle2 /> Done
            </button>
            <div className="dash-section-body">
              {doneTasks.length === 0 ? (
                <p className="dash-empty">Nothing completed yet.</p>
              ) : (
                <ul className="surface-list" style={{ padding: 0 }}>
                  {doneTasks.slice(0, 6).map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        className="dash-row dash-row--link dash-row--done"
                        onClick={() => navigate("tasks")}
                      >
                        <span className="dash-dot is-done" />
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
                      <span>{eventDisplayTime(e) ?? formatDateTime(e.starts_at)}</span>
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
      className={`dash-metric ${alert ? "is-alert" : ""}`}
      onClick={onClick}
      aria-label={`${label}: ${value}. Go to ${label.toLowerCase()}.`}
    >
      <span className="dash-metric-header">
        <Icon className="dash-metric-icon" aria-hidden />
        <span>{label}</span>
      </span>
      <span className="dash-metric-value">{value}</span>
    </button>
  );
}
