"use client";

import { useMemo, useState } from "react";
import { IonIcon } from "@ionic/react";
import { trashOutline } from "ionicons/icons";
import {
  useNotifications,
  useSharedInbox,
  useSharingMutations,
} from "@/hooks/queries";
import {
  CLEAR_ALL_ACTIVITY_MESSAGE,
  notificationDeleteMessage,
} from "@/lib/notification-messages";
import { focusSharedInboxItemWithRetry } from "@/lib/pending-focus";
import type { AppNotification, SharedItem } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { ShareImportActions } from "../sharing/ShareImportActions";
import { Button } from "../ui/Button";
import { ConfirmModal } from "../ui/ConfirmModal";
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
  highlighted,
}: {
  item: SharedItem;
  onRead: (id: number) => void;
  highlighted?: boolean;
}) {
  const payload = item.payload as Record<string, unknown>;
  const title = String(payload.title ?? "Something shared with you");

  return (
    <article
      className={`shared-inbox-card ${item.read_at ? "" : "is-unread"}${highlighted ? " focus-pulse" : ""}`}
      data-shared-item-id={item.id}
    >
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
  onOpenShared,
  onAccept,
  onDecline,
  onRead,
  onDelete,
  busy,
}: {
  notification: AppNotification;
  onOpenShared: (notification: AppNotification, sharedItemId: number) => void;
  onAccept: (id: number) => void;
  onDecline: (connectionId: number) => void;
  onRead: (id: number) => void;
  onDelete: (notification: AppNotification) => void;
  busy: boolean;
}) {
  const connectionId = notification.payload.connection_id as number | undefined;
  const sharedItemId = Number(notification.payload.shared_item_id);
  const canOpenShared =
    notification.kind === "item_shared" && Number.isFinite(sharedItemId) && sharedItemId > 0;

  return (
    <article className={`notification-row ${notification.is_read ? "" : "is-unread"}`}>
      <button
        type="button"
        className={`notification-row-main ${canOpenShared ? "is-clickable" : ""}`}
        disabled={!canOpenShared}
        onClick={() => canOpenShared && onOpenShared(notification, sharedItemId)}
      >
        <h3 className="notification-row-title">{notification.title}</h3>
        {notification.body && <p className="notification-row-body">{notification.body}</p>}
        <time className="notification-row-time">{formatDateTime(notification.created_at)}</time>
      </button>
      <div className="notification-row-footer">
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
        <button
          type="button"
          className="notification-row-delete"
          aria-label="Delete activity"
          disabled={busy}
          onClick={() => onDelete(notification)}
        >
          <IonIcon icon={trashOutline} aria-hidden />
        </button>
      </div>
    </article>
  );
}

export function NotificationsPanel() {
  const { data: notifications = [], isLoading: loadingNotes } = useNotifications();
  const { data: inbox = [], isLoading: loadingInbox } = useSharedInbox();
  const {
    acceptFromNotification,
    decline,
    markNotificationRead,
    markShareRead,
    deleteNotification,
    clearAllNotifications,
  } = useSharingMutations();

  const [deleteTarget, setDeleteTarget] = useState<AppNotification | null>(null);
  const [clearAllOpen, setClearAllOpen] = useState(false);
  const [highlightedShareId, setHighlightedShareId] = useState<number | null>(null);
  const [inboxNotice, setInboxNotice] = useState("");

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

  const busy =
    acceptFromNotification.isPending ||
    decline.isPending ||
    deleteNotification.isPending ||
    clearAllNotifications.isPending;

  const confirmDeleteOne = () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    void deleteNotification.mutateAsync(id);
  };

  const confirmClearAll = () => {
    setClearAllOpen(false);
    void clearAllNotifications.mutateAsync();
  };

  const openSharedFromActivity = (
    notification: AppNotification,
    sharedItemId: number
  ) => {
    setInboxNotice("");
    if (!notification.is_read) {
      void markNotificationRead.mutateAsync(notification.id);
    }
    setHighlightedShareId(sharedItemId);
    window.setTimeout(() => setHighlightedShareId(null), 1600);
    focusSharedInboxItemWithRetry(sharedItemId, () => {
      setInboxNotice(
        "That shared item isn't in your inbox anymore. It may have been deleted."
      );
      window.setTimeout(() => setInboxNotice(""), 4000);
    });
  };

  return (
    <PageShell title="Notifications" subtitle="Invites and shared items">
      <SurfacePanel
        toolbarTitle="Activity"
        toolbar={
          sortedNotes.length > 0 ? (
            <button
              type="button"
              className="surface-toolbar-action surface-toolbar-action--danger"
              disabled={busy}
              onClick={() => setClearAllOpen(true)}
            >
              Delete all
            </button>
          ) : undefined
        }
      >
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
                  onOpenShared={openSharedFromActivity}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  onRead={(id) => void markNotificationRead.mutateAsync(id)}
                  onDelete={setDeleteTarget}
                  busy={busy}
                />
              </li>
            ))}
          </ul>
        )}
      </SurfacePanel>

      <SurfacePanel toolbarTitle="Shared with you" className="mt-4">
        {inboxNotice && (
          <p className="shared-inbox-notice" role="status">
            {inboxNotice}
          </p>
        )}
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
                highlighted={highlightedShareId === item.id}
                onRead={(id) => void markShareRead.mutateAsync(id)}
              />
            ))}
          </div>
        )}
      </SurfacePanel>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete this activity?"
        message={deleteTarget ? notificationDeleteMessage(deleteTarget) : undefined}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteNotification.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteOne}
      />

      <ConfirmModal
        open={clearAllOpen}
        title="Delete all activity?"
        message={CLEAR_ALL_ACTIVITY_MESSAGE}
        confirmLabel="Delete all"
        variant="danger"
        loading={clearAllNotifications.isPending}
        onClose={() => setClearAllOpen(false)}
        onConfirm={confirmClearAll}
      />
    </PageShell>
  );
}
