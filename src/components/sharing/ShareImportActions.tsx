"use client";

import { useState } from "react";
import { useSharingMutations } from "@/hooks/queries";
import { useAppNavigate } from "@/context/NavigationContext";
import {
  buildSharedCopyText,
  copyTextToClipboard,
  tabForImportTarget,
} from "@/lib/share-content";
import type { ShareableType } from "@/lib/types";
import { Button } from "../ui/Button";

const IMPORT_TARGETS: { as: ShareableType; label: string }[] = [
  { as: "task", label: "Add to tasks" },
  { as: "note", label: "Add to notes" },
  { as: "event", label: "Add to reminders" },
  { as: "plan", label: "Add to plans" },
];

type ShareImportActionsProps = {
  sharedItemId: number;
  itemType: string;
  fromUsername: string;
  message?: string;
  snapshot?: Record<string, unknown>;
  notificationTitle?: string;
  notificationBody?: string;
  onImported?: () => void;
  compact?: boolean;
};

export function ShareImportActions({
  sharedItemId,
  itemType,
  fromUsername,
  message,
  snapshot,
  notificationTitle,
  notificationBody,
  onImported,
  compact,
}: ShareImportActionsProps) {
  const { importShare } = useSharingMutations();
  const { navigate } = useAppNavigate();
  const [feedback, setFeedback] = useState("");

  const copyText = buildSharedCopyText({
    itemType,
    fromUsername,
    message,
    snapshot,
    notificationTitle,
    notificationBody,
  });

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    window.setTimeout(() => setFeedback(""), 2500);
  };

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(copyText);
    showFeedback(ok ? "Copied to clipboard" : "Could not copy");
  };

  const handleImport = async (as: ShareableType) => {
    try {
      const res = await importShare.mutateAsync({ id: sharedItemId, as });
      showFeedback(`Added: ${res.title || as}`);
      onImported?.();
      navigate(tabForImportTarget(as));
    } catch {
      showFeedback("Could not add — try again");
    }
  };

  return (
    <div className={`share-import-actions ${compact ? "share-import-actions--compact" : ""}`}>
      <div className="share-import-actions-row">
        <Button type="button" variant="ghost" onClick={() => void handleCopy()}>
          Copy all
        </Button>
        {feedback && (
          <span className="share-import-feedback" role="status">
            {feedback}
          </span>
        )}
      </div>
      <div className="share-import-buttons">
        {IMPORT_TARGETS.map(({ as, label }) => (
          <Button
            key={as}
            type="button"
            variant="ghost"
            disabled={importShare.isPending}
            onClick={() => void handleImport(as)}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
