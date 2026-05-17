"use client";

import { useState } from "react";
import { useConnections, useSharingMutations } from "@/hooks/queries";
import type { ShareableType } from "@/lib/types";
import { Modal } from "../Modal";
import { Button } from "../ui/Button";

const typeLabels: Record<ShareableType, string> = {
  task: "task",
  note: "note",
  plan: "plan",
  event: "reminder",
};

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  itemType: ShareableType;
  itemId: number;
  itemTitle: string;
}

export function ShareModal({
  open,
  onClose,
  itemType,
  itemId,
  itemTitle,
}: ShareModalProps) {
  const { data: connections = [], isLoading } = useConnections();
  const { share } = useSharingMutations();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  const handleShare = async () => {
    if (selectedId === null) return;
    await share.mutateAsync({
      to_user_id: selectedId,
      item_type: itemType,
      item_id: itemId,
      message: message.trim() || undefined,
    });
    setDone(true);
    setTimeout(() => {
      setDone(false);
      setMessage("");
      setSelectedId(null);
      onClose();
    }, 1200);
  };

  const handleClose = () => {
    if (share.isPending) return;
    setDone(false);
    onClose();
  };

  return (
    <Modal title={`Share ${typeLabels[itemType]}`} open={open} onClose={handleClose} size="sm">
      {done ? (
        <p className="share-success">Sent! They'll see it in their notifications.</p>
      ) : (
        <form
          className="modal-form"
          onSubmit={(e) => {
            e.preventDefault();
            void handleShare();
          }}
        >
          <p className="field-hint" style={{ marginTop: 0 }}>
            Sharing: <strong style={{ color: "var(--text)" }}>{itemTitle}</strong>
          </p>

          {isLoading ? (
            <p className="surface-loading">Loading contacts…</p>
          ) : connections.length === 0 ? (
            <p className="share-empty">
              You don't have any contacts yet. Go to Settings → People, invite someone by email,
              and wait for them to accept.
            </p>
          ) : (
            <div className="share-contact-list" role="listbox" aria-label="Choose a contact">
              {connections.map((c) => (
                <button
                  key={c.user_id}
                  type="button"
                  role="option"
                  aria-selected={selectedId === c.user_id}
                  className={`share-contact-option ${
                    selectedId === c.user_id ? "is-selected" : ""
                  }`}
                  onClick={() => setSelectedId(c.user_id)}
                >
                  <span className="share-contact-name">{c.username}</span>
                  <span className="share-contact-email">{c.email || "No email"}</span>
                </button>
              ))}
            </div>
          )}

          {connections.length > 0 && (
            <>
              <div>
                <label className="label" htmlFor="share-message">
                  Message (optional)
                </label>
                <textarea
                  id="share-message"
                  className="input"
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a note for them…"
                />
              </div>
              <div className="modal-actions">
                <Button type="button" variant="ghost" onClick={handleClose} disabled={share.isPending}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={share.isPending}
                  disabled={selectedId === null}
                >
                  Share
                </Button>
              </div>
            </>
          )}
        </form>
      )}
    </Modal>
  );
}
