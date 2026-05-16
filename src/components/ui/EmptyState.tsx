"use client";

import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckSquare,
  Map,
  StickyNote,
} from "lucide-react";

export type EmptyStateVariant =
  | "tasks"
  | "plans"
  | "events"
  | "notes"
  | "notebooks"
  | "calendar";

const variants: Record<
  EmptyStateVariant,
  { Icon: LucideIcon; title: string; description: string }
> = {
  tasks: {
    Icon: CheckSquare,
    title: "No tasks yet",
    description: "Add one when you're ready.",
  },
  plans: {
    Icon: Map,
    title: "No plans yet",
    description: "Add a plan to track something longer-term.",
  },
  events: {
    Icon: Bell,
    title: "No reminders yet",
    description: "Add an event if you want a heads-up before it starts.",
  },
  notes: {
    Icon: StickyNote,
    title: "No notes yet",
    description: "Write something down or open one from the list.",
  },
  notebooks: {
    Icon: BookOpen,
    title: "No notebooks yet",
    description: "Make one to group related notes.",
  },
  calendar: {
    Icon: CalendarDays,
    title: "Nothing coming up",
    description: "Future events show up here.",
  },
};

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}

export function EmptyState({
  variant = "tasks",
  icon: CustomIcon,
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps) {
  const preset = variants[variant];
  const Icon = CustomIcon ?? preset.Icon;
  const displayTitle = title ?? preset.title;
  const displayDescription = description ?? preset.description;

  return (
    <div
      className={`empty-state ${compact ? "empty-state--compact" : ""}`}
      role="status"
    >
      <div className="empty-state-illustration" aria-hidden>
        <div className="empty-state-icon-ring">
          <Icon className="empty-state-icon" strokeWidth={1.35} />
        </div>
      </div>
      <h3 className="empty-state-title">{displayTitle}</h3>
      {displayDescription && (
        <p className="empty-state-description">{displayDescription}</p>
      )}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
