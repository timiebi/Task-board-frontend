"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import type { ShareableType } from "@/lib/types";
import { ShareModal } from "./ShareModal";

interface ShareItemButtonProps {
  itemType: ShareableType;
  itemId: number;
  itemTitle: string;
}

export function ShareItemButton({ itemType, itemId, itemTitle }: ShareItemButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="surface-icon-btn"
        onClick={() => setOpen(true)}
        aria-label={`Share ${itemTitle}`}
      >
        <Share2 className="h-4 w-4" />
      </button>
      <ShareModal
        open={open}
        onClose={() => setOpen(false)}
        itemType={itemType}
        itemId={itemId}
        itemTitle={itemTitle}
      />
    </>
  );
}
