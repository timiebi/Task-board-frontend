export interface Notebook {
  id: number;
  name: string;
  description: string;
  note_count: number;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: number;
  notebook: number | null;
  notebook_name?: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: number;
  title: string;
  content: string;
  start_date: string | null;
  end_date: string | null;
  status: "draft" | "active" | "done";
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  due_date: string | null;
  priority: "low" | "medium" | "high";
  status: "todo" | "in_progress" | "done";
  is_daily: boolean;
  completed: boolean;
  remind_at: string | null;
  reminded: boolean;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  starts_at: string;
  remind_at: string | null;
  notified: boolean;
  created_at: string;
  updated_at: string;
}

export type Tab = "dashboard" | "tasks" | "notes" | "plans" | "events" | "settings";
