"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellRing, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Event } from "@/lib/types";
import {
  formatDateTime,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/utils";
import { Modal } from "../Modal";
import { ConfirmModal } from "../ui/ConfirmModal";
import { EmptyState } from "../ui/EmptyState";
import { PageShell } from "../ui/PageShell";
import { SurfacePanel } from "../ui/SurfacePanel";

const emptyEvent = (): Partial<Event> => ({
  title: "",
  description: "",
  starts_at: new Date().toISOString(),
  remind_at: null,
  notified: false,
});

interface EventsPanelProps {
  onEnableNotifications: () => void;
  notificationStatus: string;
}

export function EventsPanel({
  onEnableNotifications,
  notificationStatus,
}: EventsPanelProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Event> | null>(null);
  const [startsLocal, setStartsLocal] = useState("");
  const [remindLocal, setRemindLocal] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEvents(await api.events.list());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    const e = emptyEvent();
    setEditing(e);
    setStartsLocal(toDatetimeLocalValue(e.starts_at ?? null));
    setRemindLocal("");
    setModalOpen(true);
  };

  const openEdit = (event: Event) => {
    setEditing({ ...event });
    setStartsLocal(toDatetimeLocalValue(event.starts_at));
    setRemindLocal(toDatetimeLocalValue(event.remind_at));
    setModalOpen(true);
  };

  const save = async () => {
    if (!editing?.title?.trim()) return;
    const body = {
      ...editing,
      starts_at: fromDatetimeLocalValue(startsLocal) ?? new Date().toISOString(),
      remind_at: fromDatetimeLocalValue(remindLocal),
    };
    if (editing.id) await api.events.update(editing.id, body);
    else await api.events.create(body);
    setModalOpen(false);
    load();
  };

  const remove = async (id: number) => {
    await api.events.delete(id);
    setDeleteId(null);
    load();
  };

  return (
    <PageShell
      title="Reminders"
      subtitle="Get notified before something starts"
      action={
        <div className="flex flex-wrap gap-2">
          {notificationStatus !== "granted" && (
            <button type="button" onClick={onEnableNotifications} className="btn-ghost">
              <BellRing className="h-4 w-4" /> Notify
            </button>
          )}
          <button type="button" onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" /> New event
          </button>
        </div>
      }
    >
      <SurfacePanel toolbarTitle={loading ? "Loading…" : `${events.length} events`}>
        {notificationStatus === "denied" && (
          <p className="surface-alert">
            Notifications are off. Turn them on in your browser settings.
          </p>
        )}
        {loading ? (
          <p className="surface-loading">Loading events…</p>
        ) : events.length === 0 ? (
          <EmptyState
            variant="events"
            action={
              <button type="button" onClick={openCreate} className="btn-primary">
                <Plus className="h-4 w-4" /> Add reminder
              </button>
            }
          />
        ) : (
          <ul className="surface-list">
            {events.map((event) => (
              <li key={event.id}>
                <div className="surface-item surface-item--row">
                  <div className="surface-item-main">
                    <button
                      type="button"
                      onClick={() => openEdit(event)}
                      className="surface-item-title"
                    >
                      {event.title}
                    </button>
                    {event.description && (
                      <p className="surface-item-preview surface-item-preview--clamp">
                        {event.description}
                      </p>
                    )}
                    <p className="surface-item-meta">
                      <Bell className="mr-1 inline h-3 w-3 opacity-70" />
                      Starts {formatDateTime(event.starts_at)}
                      {event.remind_at && (
                        <> · Remind {formatDateTime(event.remind_at)}</>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteId(event.id)}
                    className="surface-icon-btn is-danger"
                    aria-label="Delete event"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SurfacePanel>

      <Modal
        title={editing?.id ? "Edit event" : "New event"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input
              className="input"
              value={editing?.title ?? ""}
              onChange={(e) => setEditing((x) => ({ ...x!, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              value={editing?.description ?? ""}
              onChange={(e) => setEditing((x) => ({ ...x!, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Starts at</label>
            <input
              type="datetime-local"
              className="input"
              value={startsLocal}
              onChange={(e) => setStartsLocal(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Remind at (notification)</label>
            <input
              type="datetime-local"
              className="input"
              value={remindLocal}
              onChange={(e) => setRemindLocal(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={save}>
              Save
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={deleteId !== null}
        title="Delete event?"
        message="This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => deleteId !== null && void remove(deleteId)}
        onClose={() => setDeleteId(null)}
      />
    </PageShell>
  );
}
