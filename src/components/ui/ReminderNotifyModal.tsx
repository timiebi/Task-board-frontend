"use client";

import { Modal } from "../Modal";
import { Button } from "./Button";

interface ReminderNotifyModalProps {
  open: boolean;
  blocked?: boolean;
  loading?: boolean;
  onClose: () => void;
  onTurnOn: () => void;
  onInAppOnly: () => void;
}

export function ReminderNotifyModal({
  open,
  blocked = false,
  loading = false,
  onClose,
  onTurnOn,
  onInAppOnly,
}: ReminderNotifyModalProps) {
  return (
    <Modal
      title={blocked ? "Pop-ups are turned off" : "Want a heads-up when it's time?"}
      open={open}
      onClose={onClose}
      size="sm"
    >
      <p className="modal-message">
        {blocked
          ? "This site can't send alerts until you allow notifications in your browser settings. You can still save the time here — it'll show on the task or event."
          : "We can notify you when your reminder is due, even if this tab is closed. Or save the time in the app only — no pop-up, you'll see it when you open Task Board."}
      </p>
      <div className="modal-actions modal-actions--stack">
        {!blocked && (
          <Button type="button" loading={loading} onClick={onTurnOn}>
            Turn on alerts
          </Button>
        )}
        <Button type="button" variant="ghost" disabled={loading} onClick={onInAppOnly}>
          {blocked ? "Save time in the app" : "In the app only"}
        </Button>
        <Button type="button" variant="ghost" disabled={loading} onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
