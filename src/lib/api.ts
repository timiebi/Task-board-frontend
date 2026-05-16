import { clearAuth, getToken } from "./auth";
import type { Event, Note, Notebook, Plan, Task } from "./types";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

type RequestListener = (ok: boolean, error?: string) => void;
const listeners = new Set<RequestListener>();

export function onApiStatus(listener: RequestListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify(ok: boolean, error?: string) {
  listeners.forEach((fn) => fn(ok, error));
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Token ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    notify(false, "Cannot reach server. Is the backend running?");
    throw new ApiError("Network error", 0);
  }

  if (res.status === 401) {
    clearAuth();
    notify(false, "Session expired. Please sign in again.");
    throw new ApiError("Unauthorized", 401);
  }

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      detail = body.detail || body.error || detail;
    } catch {
      /* ignore */
    }
    notify(false, detail);
    throw new ApiError(detail, res.status);
  }

  notify(true);
  if (res.status === 204) return undefined as T;
  return res.json();
}

function unwrapList<T>(data: T[] | { results: T[] }): T[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export const api = {
  health: () => request<{ status: string }>("/health/"),
  auth: {
    login: (username: string, password: string) =>
      request<{ token: string; user: { id: number; username: string; email: string } }>(
        "/auth/login/",
        { method: "POST", body: JSON.stringify({ username, password }) }
      ),
    register: (username: string, password: string, email?: string) =>
      request<{ token: string; user: { id: number; username: string; email: string } }>(
        "/auth/register/",
        { method: "POST", body: JSON.stringify({ username, password, email }) }
      ),
    me: () =>
      request<{ id: number; username: string; email: string }>("/auth/me/"),
    logout: () => request<{ detail: string }>("/auth/logout/", { method: "POST" }),
  },
  notebooks: {
    list: () => request<Notebook[] | { results: Notebook[] }>("/notebooks/").then(unwrapList),
    create: (body: Partial<Notebook>) =>
      request<Notebook>("/notebooks/", { method: "POST", body: JSON.stringify(body) }),
    update: (id: number, body: Partial<Notebook>) =>
      request<Notebook>(`/notebooks/${id}/`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: number) => request<void>(`/notebooks/${id}/`, { method: "DELETE" }),
  },
  notes: {
    list: (notebook?: number) => {
      const q = notebook ? `?notebook=${notebook}` : "";
      return request<Note[] | { results: Note[] }>(`/notes/${q}`).then(unwrapList);
    },
    create: (body: Partial<Note>) =>
      request<Note>("/notes/", { method: "POST", body: JSON.stringify(body) }),
    update: (id: number, body: Partial<Note>) =>
      request<Note>(`/notes/${id}/`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: number) => request<void>(`/notes/${id}/`, { method: "DELETE" }),
  },
  plans: {
    list: () => request<Plan[] | { results: Plan[] }>("/plans/").then(unwrapList),
    create: (body: Partial<Plan>) =>
      request<Plan>("/plans/", { method: "POST", body: JSON.stringify(body) }),
    update: (id: number, body: Partial<Plan>) =>
      request<Plan>(`/plans/${id}/`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: number) => request<void>(`/plans/${id}/`, { method: "DELETE" }),
  },
  tasks: {
    list: (params?: { daily?: boolean; status?: string }) => {
      const search = new URLSearchParams();
      if (params?.daily !== undefined) search.set("daily", String(params.daily));
      if (params?.status) search.set("status", params.status);
      const q = search.toString() ? `?${search}` : "";
      return request<Task[] | { results: Task[] }>(`/tasks/${q}`).then(unwrapList);
    },
    today: () => request<Task[]>("/tasks/today/"),
    create: (body: Partial<Task>) =>
      request<Task>("/tasks/", { method: "POST", body: JSON.stringify(body) }),
    update: (id: number, body: Partial<Task>) =>
      request<Task>(`/tasks/${id}/`, { method: "PATCH", body: JSON.stringify(body) }),
    toggleComplete: (id: number) =>
      request<Task>(`/tasks/${id}/toggle_complete/`, { method: "POST" }),
    delete: (id: number) => request<void>(`/tasks/${id}/`, { method: "DELETE" }),
  },
  events: {
    list: () => request<Event[] | { results: Event[] }>("/events/").then(unwrapList),
    dueReminders: () => request<Event[]>("/events/due_reminders/"),
    create: (body: Partial<Event>) =>
      request<Event>("/events/", { method: "POST", body: JSON.stringify(body) }),
    update: (id: number, body: Partial<Event>) =>
      request<Event>(`/events/${id}/`, { method: "PATCH", body: JSON.stringify(body) }),
    markNotified: (id: number) =>
      request<Event>(`/events/${id}/mark_notified/`, { method: "POST" }),
    delete: (id: number) => request<void>(`/events/${id}/`, { method: "DELETE" }),
  },
};
