import { apiRequest } from "./api-client";
import type { Event, Note, Notebook, Plan, Task } from "./types";

export { ApiError, onApiStatus } from "./api-client";

function unwrapList<T>(data: T[] | { results: T[] }): T[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export const api = {
  health: () => apiRequest<{ status: string }>("GET", "/health/"),
  auth: {
    login: (username: string, password: string) =>
      apiRequest<{ token: string; user: { id: number; username: string; email: string } }>(
        "POST",
        "/auth/login/",
        { username, password }
      ),
    register: (username: string, password: string, email?: string) =>
      apiRequest<{ token: string; user: { id: number; username: string; email: string } }>(
        "POST",
        "/auth/register/",
        { username, password, email }
      ),
    me: () =>
      apiRequest<{ id: number; username: string; email: string }>("GET", "/auth/me/"),
    logout: () => apiRequest<{ detail: string }>("POST", "/auth/logout/"),
  },
  notebooks: {
    list: () =>
      apiRequest<Notebook[] | { results: Notebook[] }>("GET", "/notebooks/").then(
        unwrapList
      ),
    create: (body: Partial<Notebook>) =>
      apiRequest<Notebook>("POST", "/notebooks/", body),
    update: (id: number, body: Partial<Notebook>) =>
      apiRequest<Notebook>("PATCH", `/notebooks/${id}/`, body),
    delete: (id: number) => apiRequest<void>("DELETE", `/notebooks/${id}/`),
  },
  notes: {
    list: (notebook?: number) => {
      const q = notebook ? `?notebook=${notebook}` : "";
      return apiRequest<Note[] | { results: Note[] }>("GET", `/notes/${q}`).then(
        unwrapList
      );
    },
    create: (body: Partial<Note>) => apiRequest<Note>("POST", "/notes/", body),
    update: (id: number, body: Partial<Note>) =>
      apiRequest<Note>("PATCH", `/notes/${id}/`, body),
    delete: (id: number) => apiRequest<void>("DELETE", `/notes/${id}/`),
  },
  plans: {
    list: () =>
      apiRequest<Plan[] | { results: Plan[] }>("GET", "/plans/").then(unwrapList),
    create: (body: Partial<Plan>) => apiRequest<Plan>("POST", "/plans/", body),
    update: (id: number, body: Partial<Plan>) =>
      apiRequest<Plan>("PATCH", `/plans/${id}/`, body),
    delete: (id: number) => apiRequest<void>("DELETE", `/plans/${id}/`),
  },
  tasks: {
    list: (params?: { daily?: boolean; status?: string }) => {
      const search = new URLSearchParams();
      if (params?.daily !== undefined) search.set("daily", String(params.daily));
      if (params?.status) search.set("status", params.status);
      const q = search.toString() ? `?${search}` : "";
      return apiRequest<Task[] | { results: Task[] }>("GET", `/tasks/${q}`).then(
        unwrapList
      );
    },
    today: () => apiRequest<Task[]>("GET", "/tasks/today/"),
    create: (body: Partial<Task>) => apiRequest<Task>("POST", "/tasks/", body),
    update: (id: number, body: Partial<Task>) =>
      apiRequest<Task>("PATCH", `/tasks/${id}/`, body),
    toggleComplete: (id: number) =>
      apiRequest<Task>("POST", `/tasks/${id}/toggle_complete/`),
    delete: (id: number) => apiRequest<void>("DELETE", `/tasks/${id}/`),
  },
  events: {
    list: () =>
      apiRequest<Event[] | { results: Event[] }>("GET", "/events/").then(unwrapList),
    dueReminders: () => apiRequest<Event[]>("GET", "/events/due_reminders/"),
    create: (body: Partial<Event>) => apiRequest<Event>("POST", "/events/", body),
    update: (id: number, body: Partial<Event>) =>
      apiRequest<Event>("PATCH", `/events/${id}/`, body),
    markNotified: (id: number) =>
      apiRequest<Event>("POST", `/events/${id}/mark_notified/`),
    delete: (id: number) => apiRequest<void>("DELETE", `/events/${id}/`),
  },
};
