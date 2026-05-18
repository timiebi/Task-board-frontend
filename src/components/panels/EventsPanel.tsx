"use client";

import { useState } from "react";
import { Bell, BellRing, Plus, Trash2 } from "lucide-react";
import { useReminderNotifyGate } from "@/hooks/useReminderNotifyGate";
import { useEventMutations, useEvents } from "@/hooks/queries";
import { hasActiveNotifications } from "@/lib/notifications-ready";
import type { Event } from "@/lib/types";
import {
  formatDateTime,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/utils";
import { ShareItemButton } from "../sharing/ShareItemButton";
import { Modal } from "../Modal";
import { Button } from "../ui/Button";
import { ConfirmModal } from "../ui/ConfirmModal";
import { ReminderNotifyModal } from "../ui/ReminderNotifyModal";
import { DateTimeField } from "../ui/DateTimeField";
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
  const { data: events = [], isLoading: loading } = useEvents();
  const { create, update, remove } = useEventMutations();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Event> | null>(null);
  const [startsLocal, setStartsLocal] = useState("");
  const [remindLocal, setRemindLocal] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const notifyGate = useReminderNotifyGate();
  const saving = create.isPending || update.isPending;

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

  const persistEvent = async () => {
    if (!editing?.title?.trim()) return;
    const body = {
      ...editing,
      starts_at: fromDatetimeLocalValue(startsLocal) ?? new Date().toISOString(),
      remind_at: fromDatetimeLocalValue(remindLocal),
    };
    if (editing.id) await update.mutateAsync({ id: editing.id, body });
    else await create.mutateAsync(body);
    setModalOpen(false);
  };

  const save = async () => {
    if (!editing?.title?.trim()) return;
    const hasReminder = !!fromDatetimeLocalValue(remindLocal);
    if (hasReminder && !hasActiveNotifications()) {
      notifyGate.gate(() => void persistEvent());
      return;
    }
    await persistEvent();
  };

  const onRemindChange = (value: string) => {
    const hadValue = !!remindLocal.trim();
    setRemindLocal(value);
    if (!value.trim() || hadValue || hasActiveNotifications()) return;
    notifyGate.gate(() => {});
  };

  const removeEvent = async (id: number) => {
    await remove.mutateAsync(id);
    setDeleteId(null);
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
          <Button type="button" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New event
          </Button>
        </div>
      }
    >
      <SurfacePanel toolbarTitle={loading ? "Loading…" : `${events.length} events`}>
        {notificationStatus === "denied" && (
          <p className="surface-alert">
            Reminders won't pop up until you allow notifications in your browser settings.
          </p>
        )}
        {loading ? (
          <p className="surface-loading">Loading events…</p>
        ) : events.length === 0 ? (
          <EmptyState
            variant="events"
            action={
              <Button type="button" onClick={openCreate}>
                <Plus className="h-4 w-4" /> Add reminder
              </Button>
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
                  <ShareItemButton itemType="event" itemId={event.id} itemTitle={event.title} />
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
        onClose={() => !saving && setModalOpen(false)}
      >
        <form
          className="modal-form"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <div>
            <label className="label" htmlFor="event-title">Title</label>
            <input
              id="event-title"
              className="input"
              value={editing?.title ?? ""}
              onChange={(e) => setEditing((x) => ({ ...x!, title: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="event-desc">Description</label>
            <textarea
              id="event-desc"
              className="input"
              rows={3}
              value={editing?.description ?? ""}
              onChange={(e) => setEditing((x) => ({ ...x!, description: e.target.value }))}
            />
          </div>
          <DateTimeField id="event-starts" label="Starts at" value={startsLocal} onChange={setStartsLocal} />
          <DateTimeField
            id="event-remind"
            label="Remind me at"
            hint="Optional — we'll nudge you at this time"
            value={remindLocal}
            onChange={onRemindChange}
            optional
          />
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save event
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={deleteId !== null}
        title="Delete event?"
        message="This reminder will be deleted permanently."
        confirmLabel="Delete"
        variant="danger"
        loading={remove.isPending}
        onConfirm={() => deleteId !== null && void removeEvent(deleteId)}
        onClose={() => setDeleteId(null)}
      />

      <ReminderNotifyModal
        open={notifyGate.promptOpen}
        blocked={notifyGate.blocked}
        loading={notifyGate.enabling}
        onClose={notifyGate.close}
        onTurnOn={() => void notifyGate.turnOn()}
        onInAppOnly={notifyGate.inAppOnly}
      />
    </PageShell>
  );
}
