"use client";

import { useMemo } from "react";
import {
  useNotifications,
  useSharedInbox,
  useSharingMutations,
} from "@/hooks/queries";
import type { AppNotification, SharedItem } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { Button } from "../ui/Button";
import { PageShell } from "../ui/PageShell";
import { SurfacePanel } from "../ui/SurfacePanel";

function SharedItemCard({
  item,
  onRead,
}: {
  item: SharedItem;
  onRead: (id: number) => void;
}) {
  const payload = item.payload as Record<string, string | boolean | null>;
  const title = String(payload.title ?? "Something shared with you");

  return (
    <article className={`shared-inbox-card ${item.read_at ? "" : "is-unread"}`}>
      <header className="shared-inbox-card-header">
        <span className="shared-inbox-type">{item.item_type}</span>
        <span className="shared-inbox-from">from {item.shared_by_username}</span>
        <time className="shared-inbox-time">{formatDateTime(item.created_at)}</time>
      </header>
      <h3 className="shared-inbox-title">{title}</h3>
      {item.message && <p className="shared-inbox-message">{item.message}</p>}
      {item.item_type === "task" && payload.description && (
        <p className="shared-inbox-body">{String(payload.description)}</p>
      )}
      {item.item_type === "note" && payload.content && (
        <p className="shared-inbox-body">{String(payload.content)}</p>
      )}
      {item.item_type === "plan" && payload.content && (
        <p className="shared-inbox-body">{String(payload.content)}</p>
      )}
      {item.item_type === "event" && payload.starts_at && (
        <p className="shared-inbox-meta">Starts {formatDateTime(String(payload.starts_at))}</p>
      )}
      {item.item_type === "task" && payload.due_date && (
        <p className="shared-inbox-meta">Due {formatDateTime(String(payload.due_date))}</p>
      )}
      {!item.read_at && (
        <Button type="button" variant="ghost" onClick={() => onRead(item.id)}>
          Mark as read
        </Button>
      )}
    </article>
  );
}

function NotificationRow({
  notification,
  onAccept,
  onDecline,
  onRead,
  busy,
}: {
  notification: AppNotification;
  onAccept: (id: number) => void;
  onDecline: (connectionId: number) => void;
  onRead: (id: number) => void;
  busy: boolean;
}) {
  const connectionId = notification.payload.connection_id as number | undefined;

  return (
    <article className={`notification-row ${notification.is_read ? "" : "is-unread"}`}>
      <div className="notification-row-main">
        <h3 className="notification-row-title">{notification.title}</h3>
        {notification.body && <p className="notification-row-body">{notification.body}</p>}
        <time className="notification-row-time">{formatDateTime(notification.created_at)}</time>
      </div>
      {notification.kind === "connection_invite" && notification.action_required && (
        <div className="notification-row-actions">
          <Button
            type="button"
            onClick={() => onAccept(notification.id)}
            loading={busy}
            disabled={busy}
          >
            Accept
          </Button>
          {connectionId && (
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => onDecline(connectionId)}
            >
              Decline
            </Button>
          )}
        </div>
      )}
      {notification.kind === "item_shared" && !notification.is_read && (
        <Button type="button" variant="ghost" onClick={() => onRead(notification.id)}>
          Dismiss
        </Button>
      )}
      {notification.kind === "connection_accepted" && !notification.is_read && (
        <Button type="button" variant="ghost" onClick={() => onRead(notification.id)}>
          Dismiss
        </Button>
      )}
    </article>
  );
}

export function NotificationsPanel() {
  const { data: notifications = [], isLoading: loadingNotes } = useNotifications();
  const { data: inbox = [], isLoading: loadingInbox } = useSharedInbox();
  const { acceptFromNotification, decline, markNotificationRead, markShareRead } =
    useSharingMutations();

  const sortedNotes = useMemo(
    () =>
      [...notifications].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [notifications]
  );

  const handleAccept = async (notificationId: number) => {
    await acceptFromNotification.mutateAsync(notificationId);
  };

  const handleDecline = async (connectionId: number) => {
    await decline.mutateAsync(connectionId);
  };

  const busy = acceptFromNotification.isPending || decline.isPending;

  return (
    <PageShell title="Notifications" subtitle="Invites and shared items">
      <SurfacePanel toolbarTitle="Activity">
        {loadingNotes ? (
          <p className="surface-loading">Loading…</p>
        ) : sortedNotes.length === 0 ? (
          <p className="dash-empty" style={{ padding: 24 }}>
            You're all caught up. Invites and shares will show up here.
          </p>
        ) : (
          <ul className="notification-list">
            {sortedNotes.map((n) => (
              <li key={n.id}>
                <NotificationRow
                  notification={n}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  onRead={(id) => void markNotificationRead.mutateAsync(id)}
                  busy={busy}
                />
              </li>
            ))}
          </ul>
        )}
      </SurfacePanel>

      <SurfacePanel toolbarTitle="Shared with you" className="mt-4">
        {loadingInbox ? (
          <p className="surface-loading">Loading shared items…</p>
        ) : inbox.length === 0 ? (
          <p className="dash-empty" style={{ padding: 24 }}>
            When someone shares something with you, you'll see the full details here.
          </p>
        ) : (
          <div className="shared-inbox-grid">
            {inbox.map((item) => (
              <SharedItemCard
                key={item.id}
                item={item}
                onRead={(id) => void markShareRead.mutateAsync(id)}
              />
            ))}
          </div>
        )}
      </SurfacePanel>
    </PageShell>
  );
}
