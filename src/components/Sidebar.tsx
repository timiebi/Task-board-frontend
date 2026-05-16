"use client";

import {
  Bell,
  BookOpen,
  CheckSquare,
  LayoutDashboard,
  Map,
} from "lucide-react";
import type { Tab } from "@/lib/types";

const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "notes", label: "Notes", icon: BookOpen },
  { id: "plans", label: "Plans", icon: Map },
  { id: "events", label: "Reminders", icon: Bell },
];

interface SidebarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export function Sidebar({ active, onChange }: SidebarProps) {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-surface-border bg-surface-raised/50 p-4">
      <div className="mb-8 px-2">
        <h1 className="text-lg font-bold tracking-tight text-white">Task Board</h1>
        <p className="text-xs text-[var(--muted)]">Your personal command center</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active === id
                ? "bg-accent/20 text-accent"
                : "text-[var(--muted)] hover:bg-white/5 hover:text-[var(--text)]"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
