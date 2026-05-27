"use client";

import { useMemo } from "react";
import {
  useNotifications,
  useSharedInbox,
  useSharingMutations,
} from "@/hooks/queries";
import { buildSharedCopyText } from "@/lib/share-content";
import type { AppNotification, SharedItem } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { ShareImportActions } from "../sharing/ShareImportActions";
import { Button } from "../ui/Button";
import { PageShell } from "../ui/PageShell";
import { SurfacePanel } from "../ui/SurfacePanel";

function SharedBodyPreview({
  itemType,
  payload,
}: {
  itemType: string;
  payload: Record<string, unknown>;
}) {
  if (itemType === "task" && payload.description) {
    return <p className="shared-inbox-body">{String(payload.description)}</p>;
  }
  if ((itemType === "note" || itemType === "plan") && payload.content) {
    return <p className="shared-inbox-body">{String(payload.content)}</p>;
  }
  if (itemType === "event") {
    return (
      <>
        {payload.description && (
          <p className="shared-inbox-body">{String(payload.description)}</p>
        )}
        {payload.starts_at && (
          <p className="shared-inbox-meta">
            Starts {formatDateTime(String(payload.starts_at))}
          </p>
        )}
      </>
    );
  }
  return null;
}

function SharedItemCard({
  item,
  onRead,
}: {
  item: SharedItem;
  onRead: (id: number) => void;
}) {
  const payload = item.payload as Record<string, unknown>;
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
      <SharedBodyPreview itemType={item.item_type} payload={payload} />
      {item.item_type === "task" && payload.due_date != null && (
        <p className="shared-inbox-meta">Due {formatDateTime(String(payload.due_date))}</p>
      )}
      <ShareImportActions
        sharedItemId={item.id}
        itemType={item.item_type}
        fromUsername={item.shared_by_username}
        message={item.message}
        snapshot={payload}
        onImported={() => {
          if (!item.read_at) onRead(item.id);
        }}
      />
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
  inboxById,
  onAccept,
  onDecline,
  onRead,
  busy,
}: {
  notification: AppNotification;
  inboxById: Map<number, SharedItem>;
  onAccept: (id: number) => void;
  onDecline: (connectionId: number) => void;
  onRead: (id: number) => void;
  busy: boolean;
}) {
  const connectionId = notification.payload.connection_id as number | undefined;
  const sharedItemId = notification.payload.shared_item_id as number | undefined;
  const inboxItem = sharedItemId ? inboxById.get(sharedItemId) : undefined;
  const itemType = String(
    notification.payload.item_type ?? inboxItem?.item_type ?? "task"
  );
  const fromUsername = String(
    notification.payload.from_username ?? inboxItem?.shared_by_username ?? "someone"
  );
  const message = String(
    notification.payload.message ?? inboxItem?.message ?? ""
  );
  const snapshot = (notification.payload.snapshot ??
    inboxItem?.payload) as Record<string, unknown> | undefined;

  const fullPreview =
    notification.kind === "item_shared" && snapshot
      ? buildSharedCopyText({
          itemType,
          fromUsername,
          message,
          snapshot,
          notificationTitle: notification.title,
          notificationBody: notification.body,
        })
      : null;

  return (
    <article className={`notification-row ${notification.is_read ? "" : "is-unread"}`}>
      <div className="notification-row-main">
        <h3 className="notification-row-title">{notification.title}</h3>
        {notification.body && <p className="notification-row-body">{notification.body}</p>}
        {fullPreview && (
          <pre className="notification-row-full-body">{fullPreview}</pre>
        )}
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
      {notification.kind === "item_shared" && sharedItemId && (
        <ShareImportActions
          sharedItemId={sharedItemId}
          itemType={itemType}
          fromUsername={fromUsername}
          message={message}
          snapshot={snapshot ?? {}}
          notificationTitle={notification.title}
          notificationBody={notification.body}
          compact
          onImported={() => {
            if (!notification.is_read) onRead(notification.id);
          }}
        />
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

  const inboxById = useMemo(() => {
    const map = new Map<number, SharedItem>();
    for (const item of inbox) map.set(item.id, item);
    return map;
  }, [inbox]);

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
                  inboxById={inboxById}
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
