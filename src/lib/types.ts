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

export type ShareableType = "task" | "note" | "plan" | "event";

export interface SpaceMember {
  id: number;
  user_id: number;
  username: string;
  email: string;
}

export interface SpaceInvite {
  id: number;
  from_username: string;
  to_username: string | null;
  invite_email: string;
  display_name: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  updated_at: string;
}

export interface SharedItem {
  id: number;
  shared_by_username: string;
  item_type: ShareableType;
  item_id: number;
  payload: Record<string, unknown>;
  message: string;
  read_at: string | null;
  created_at: string;
}

export interface AppNotification {
  id: number;
  kind: "connection_invite" | "connection_accepted" | "item_shared";
  title: string;
  body: string;
  payload: Record<string, unknown>;
  is_read: boolean;
  action_required: boolean;
  read_at: string | null;
  created_at: string;
}

export type Tab =
  | "dashboard"
  | "tasks"
  | "notes"
  | "plans"
  | "events"
  | "notifications"
  | "settings";
