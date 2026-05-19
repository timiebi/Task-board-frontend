"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import {
  mergeItem,
  patchLists,
  prependOptimistic,
  removeItem,
  replaceItem,
  restoreSnapshots,
  snapshotLists,
  tempItemId,
  type OptimisticContext,
} from "@/lib/optimistic";
import { eventUpcomingTimestamp, isUpcomingEvent } from "@/lib/utils";
import type {
  AppNotification,
  Event,
  Note,
  Notebook,
  Plan,
  ShareableType,
  Task,
} from "@/lib/types";

export function useAuthMe(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => api.auth.me(),
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useTasks(filter: "today" | "daily" | "all") {
  return useQuery({
    queryKey: queryKeys.tasks.list(filter),
    queryFn: () => {
      if (filter === "today") return api.tasks.today();
      if (filter === "daily") return api.tasks.list({ daily: true });
      return api.tasks.list();
    },
  });
}

function buildOptimisticTask(body: Partial<Task>, id: number): Task {
  const now = new Date().toISOString();
  return {
    id,
    title: body.title ?? "",
    description: body.description ?? "",
    due_date: body.due_date ?? null,
    priority: body.priority ?? "medium",
    status: body.status ?? "todo",
    is_daily: body.is_daily ?? false,
    completed: body.completed ?? false,
    remind_at: body.remind_at ?? null,
    reminded: body.reminded ?? false,
    created_at: now,
    updated_at: now,
  };
}

export function useTaskMutations(_filter: "today" | "daily" | "all") {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.root });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  };

  const create = useMutation<Task, Error, Partial<Task>, OptimisticContext<Task>>({
    mutationFn: (body) => api.tasks.create(body),
    onMutate: async (body) => {
      const snapshots = await snapshotLists<Task>(queryClient, queryKeys.tasks.root);
      const tempId = tempItemId();
      prependOptimistic(queryClient, queryKeys.tasks.root, buildOptimisticTask(body, tempId));
      return { snapshots, tempId };
    },
    onSuccess: (created, _body, context) => {
      if (context?.tempId != null) {
        replaceItem(queryClient, queryKeys.tasks.root, context.tempId, created);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
    onError: (_err, _body, context) => {
      if (context) restoreSnapshots(queryClient, context.snapshots);
      invalidate();
    },
  });

  const update = useMutation<
    Task,
    Error,
    { id: number; body: Partial<Task> },
    OptimisticContext<Task>
  >({
    mutationFn: ({ id, body }) => api.tasks.update(id, body),
    onMutate: async ({ id, body }) => {
      const snapshots = await snapshotLists<Task>(queryClient, queryKeys.tasks.root);
      mergeItem<Task>(queryClient, queryKeys.tasks.root, id, body);
      return { snapshots };
    },
    onSuccess: (updated) => {
      replaceItem(queryClient, queryKeys.tasks.root, updated.id, updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
    onError: (_err, _vars, context) => {
      if (context) restoreSnapshots(queryClient, context.snapshots);
      invalidate();
    },
  });

  const toggleComplete = useMutation<Task, Error, number, OptimisticContext<Task>>({
    mutationFn: (id) => api.tasks.toggleComplete(id),
    onMutate: async (id) => {
      const snapshots = await snapshotLists<Task>(queryClient, queryKeys.tasks.root);
      queryClient.setQueriesData<Task[]>(
        { queryKey: queryKeys.tasks.root },
        (old) => {
          if (!old) return old;
          return old.map((t) => {
            if (t.id !== id) return t;
            const completed = !t.completed;
            return {
              ...t,
              completed,
              status: completed ? "done" : t.status === "done" ? "todo" : t.status,
            };
          });
        }
      );
      return { snapshots };
    },
    onSuccess: (updated) => {
      replaceItem(queryClient, queryKeys.tasks.root, updated.id, updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
    onError: (_err, _id, context) => {
      if (context) restoreSnapshots(queryClient, context.snapshots);
      invalidate();
    },
  });

  const remove = useMutation<void, Error, number, OptimisticContext<Task>>({
    mutationFn: (id) => api.tasks.delete(id),
    onMutate: async (id) => {
      const snapshots = await snapshotLists<Task>(queryClient, queryKeys.tasks.root);
      removeItem<Task>(queryClient, queryKeys.tasks.root, id);
      return { snapshots };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
    onError: (_err, _id, context) => {
      if (context) restoreSnapshots(queryClient, context.snapshots);
      invalidate();
    },
  });

  const markReminded = useMutation({
    mutationFn: (id: number) => api.tasks.markReminded(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.dueReminders });
    },
  });

  return { create, update, toggleComplete, remove, markReminded };
}

export function useNotebooks() {
  return useQuery({
    queryKey: queryKeys.notebooks.all,
    queryFn: () => api.notebooks.list(),
  });
}

function buildOptimisticNotebook(body: Partial<Notebook>, id: number): Notebook {
  const now = new Date().toISOString();
  return {
    id,
    name: body.name ?? "",
    description: body.description ?? "",
    note_count: body.note_count ?? 0,
    created_at: now,
    updated_at: now,
  };
}

export function useNotebookMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.notebooks.root });

  const create = useMutation<Notebook, Error, Partial<Notebook>, OptimisticContext<Notebook>>({
    mutationFn: (body) => api.notebooks.create(body),
    onMutate: async (body) => {
      const snapshots = await snapshotLists<Notebook>(queryClient, queryKeys.notebooks.root);
      const tempId = tempItemId();
      prependOptimistic(
        queryClient,
        queryKeys.notebooks.root,
        buildOptimisticNotebook(body, tempId)
      );
      return { snapshots, tempId };
    },
    onSuccess: (created, _body, context) => {
      if (context?.tempId != null) {
        replaceItem(queryClient, queryKeys.notebooks.root, context.tempId, created);
      }
    },
    onError: (_err, _body, context) => {
      if (context) restoreSnapshots(queryClient, context.snapshots);
      invalidate();
    },
  });

  const update = useMutation<
    Notebook,
    Error,
    { id: number; body: Partial<Notebook> },
    OptimisticContext<Notebook>
  >({
    mutationFn: ({ id, body }) => api.notebooks.update(id, body),
    onMutate: async ({ id, body }) => {
      const snapshots = await snapshotLists<Notebook>(queryClient, queryKeys.notebooks.root);
      mergeItem(queryClient, queryKeys.notebooks.root, id, body);
      return { snapshots };
    },
    onSuccess: (updated) => {
      replaceItem(queryClient, queryKeys.notebooks.root, updated.id, updated);
    },
    onError: (_err, _vars, context) => {
      if (context) restoreSnapshots(queryClient, context.snapshots);
      invalidate();
    },
  });

  const remove = useMutation<void, Error, number, OptimisticContext<Notebook>>({
    mutationFn: (id) => api.notebooks.delete(id),
    onMutate: async (id) => {
      const snapshots = await snapshotLists<Notebook>(queryClient, queryKeys.notebooks.root);
      removeItem(queryClient, queryKeys.notebooks.root, id);
      return { snapshots };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.root });
    },
    onError: (_err, _id, context) => {
      if (context) restoreSnapshots(queryClient, context.snapshots);
      invalidate();
    },
  });

  return { create, update, remove };
}

export function useNotes(notebook: number | null) {
  return useQuery({
    queryKey: queryKeys.notes.list(notebook),
    queryFn: async () => {
      const data = await api.notes.list(notebook ?? undefined);
      return [...data].sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
    },
  });
}

function buildOptimisticNote(body: Partial<Note>, id: number, notebook: number | null): Note {
  const now = new Date().toISOString();
  return {
    id,
    notebook: body.notebook ?? notebook,
    notebook_name: body.notebook_name,
    title: body.title ?? "",
    content: body.content ?? "",
    is_pinned: body.is_pinned ?? false,
    created_at: now,
    updated_at: now,
  };
}

function sortNotes(list: Note[]): Note[] {
  return [...list].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
}

export function useNoteMutations(notebook: number | null) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.notes.root });

  const create = useMutation<Note, Error, Partial<Note>, OptimisticContext<Note>>({
    mutationFn: (body) => api.notes.create(body),
    onMutate: async (body) => {
      const snapshots = await snapshotLists<Note>(queryClient, queryKeys.notes.root);
      const tempId = tempItemId();
      const optimistic = buildOptimisticNote(body, tempId, notebook);
      patchLists<Note>(queryClient, queryKeys.notes.root, (list) =>
        sortNotes([optimistic, ...list])
      );
      return { snapshots, tempId };
    },
    onSuccess: (created, _body, context) => {
      if (context?.tempId != null) {
        replaceItem(queryClient, queryKeys.notes.root, context.tempId, created);
        patchLists<Note>(queryClient, queryKeys.notes.root, sortNotes);
      }
    },
    onError: (_err, _body, context) => {
      if (context) restoreSnapshots(queryClient, context.snapshots);
      invalidate();
    },
  });

  const update = useMutation<
    Note,
    Error,
    { id: number; body: Partial<Note> },
    OptimisticContext<Note>
  >({
    mutationFn: ({ id, body }) => api.notes.update(id, body),
    onMutate: async ({ id, body }) => {
      const snapshots = await snapshotLists<Note>(queryClient, queryKeys.notes.root);
      mergeItem(queryClient, queryKeys.notes.root, id, {
        ...body,
        updated_at: new Date().toISOString(),
      });
      patchLists<Note>(queryClient, queryKeys.notes.root, sortNotes);
      return { snapshots };
    },
    onSuccess: (updated) => {
      replaceItem(queryClient, queryKeys.notes.root, updated.id, updated);
      patchLists<Note>(queryClient, queryKeys.notes.root, sortNotes);
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
    onError: (_err, _vars, context) => {
      if (context) restoreSnapshots(queryClient, context.snapshots);
      invalidate();
    },
  });

  const remove = useMutation<void, Error, number, OptimisticContext<Note>>({
    mutationFn: (id) => api.notes.delete(id),
    onMutate: async (id) => {
      const snapshots = await snapshotLists<Note>(queryClient, queryKeys.notes.root);
      removeItem(queryClient, queryKeys.notes.root, id);
      return { snapshots };
    },
    onError: (_err, _id, context) => {
      if (context) restoreSnapshots(queryClient, context.snapshots);
      invalidate();
    },
  });

  return { create, update, remove };
}

export function usePlans() {
  return useQuery({
    queryKey: queryKeys.plans.all,
    queryFn: () => api.plans.list(),
  });
}

function buildOptimisticPlan(body: Partial<Plan>, id: number): Plan {
  const now = new Date().toISOString();
  return {
    id,
    title: body.title ?? "",
    content: body.content ?? "",
    start_date: body.start_date ?? null,
    end_date: body.end_date ?? null,
    status: body.status ?? "draft",
    created_at: now,
    updated_at: now,
  };
}

export function usePlanMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.plans.root });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  };

  const create = useMutation<Plan, Error, Partial<Plan>, OptimisticContext<Plan>>({
    mutationFn: (body) => api.plans.create(body),
    onMutate: async (body) => {
      const snapshots = await snapshotLists<Plan>(queryClient, queryKeys.plans.root);
      const tempId = tempItemId();
      prependOptimistic(queryClient, queryKeys.plans.root, buildOptimisticPlan(body, tempId));
      return { snapshots, tempId };
    },
    onSuccess: (created, _body, context) => {
      if (context?.tempId != null) {
        replaceItem(queryClient, queryKeys.plans.root, context.tempId, created);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
    onError: (_err, _body, context) => {
      if (context) restoreSnapshots(queryClient, context.snapshots);
      invalidate();
    },
  });

  const update = useMutation<
    Plan,
    Error,
    { id: number; body: Partial<Plan> },
    OptimisticContext<Plan>
  >({
    mutationFn: ({ id, body }) => api.plans.update(id, body),
    onMutate: async ({ id, body }) => {
      const snapshots = await snapshotLists<Plan>(queryClient, queryKeys.plans.root);
      mergeItem(queryClient, queryKeys.plans.root, id, body);
      return { snapshots };
    },
    onSuccess: (updated) => {
      replaceItem(queryClient, queryKeys.plans.root, updated.id, updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
    onError: (_err, _vars, context) => {
      if (context) restoreSnapshots(queryClient, context.snapshots);
      invalidate();
    },
  });

  const remove = useMutation<void, Error, number, OptimisticContext<Plan>>({
    mutationFn: (id) => api.plans.delete(id),
    onMutate: async (id) => {
      const snapshots = await snapshotLists<Plan>(queryClient, queryKeys.plans.root);
      removeItem(queryClient, queryKeys.plans.root, id);
      return { snapshots };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
    onError: (_err, _id, context) => {
      if (context) restoreSnapshots(queryClient, context.snapshots);
      invalidate();
    },
  });

  return { create, update, remove };
}

export function useEvents() {
  return useQuery({
    queryKey: queryKeys.events.all,
    queryFn: () => api.events.list(),
  });
}

function buildOptimisticEvent(body: Partial<Event>, id: number): Event {
  const now = new Date().toISOString();
  return {
    id,
    title: body.title ?? "",
    description: body.description ?? "",
    starts_at: body.starts_at ?? now,
    remind_at: body.remind_at ?? null,
    notified: body.notified ?? false,
    created_at: now,
    updated_at: now,
  };
}

export function useEventMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.events.root });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  };

  const create = useMutation<Event, Error, Partial<Event>, OptimisticContext<Event>>({
    mutationFn: (body) => api.events.create(body),
    onMutate: async (body) => {
      const snapshots = await snapshotLists<Event>(queryClient, queryKeys.events.root);
      const tempId = tempItemId();
      prependOptimistic(queryClient, queryKeys.events.root, buildOptimisticEvent(body, tempId));
      return { snapshots, tempId };
    },
    onSuccess: (created, _body, context) => {
      if (context?.tempId != null) {
        replaceItem(queryClient, queryKeys.events.root, context.tempId, created);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
    onError: (_err, _body, context) => {
      if (context) restoreSnapshots(queryClient, context.snapshots);
      invalidate();
    },
  });

  const update = useMutation<
    Event,
    Error,
    { id: number; body: Partial<Event> },
    OptimisticContext<Event>
  >({
    mutationFn: ({ id, body }) => api.events.update(id, body),
    onMutate: async ({ id, body }) => {
      const snapshots = await snapshotLists<Event>(queryClient, queryKeys.events.root);
      mergeItem(queryClient, queryKeys.events.root, id, body);
      return { snapshots };
    },
    onSuccess: (updated) => {
      replaceItem(queryClient, queryKeys.events.root, updated.id, updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
    onError: (_err, _vars, context) => {
      if (context) restoreSnapshots(queryClient, context.snapshots);
      invalidate();
    },
  });

  const remove = useMutation<void, Error, number, OptimisticContext<Event>>({
    mutationFn: (id) => api.events.delete(id),
    onMutate: async (id) => {
      const snapshots = await snapshotLists<Event>(queryClient, queryKeys.events.root);
      removeItem(queryClient, queryKeys.events.root, id);
      return { snapshots };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
    onError: (_err, _id, context) => {
      if (context) restoreSnapshots(queryClient, context.snapshots);
      invalidate();
    },
  });

  const markNotified = useMutation({
    mutationFn: (id: number) => api.events.markNotified(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.dueReminders });
    },
  });

  return { create, update, remove, markNotified };
}

export function useDueReminders(enabled: boolean) {
  return useQuery({
    queryKey: [...queryKeys.events.dueReminders, ...queryKeys.tasks.dueReminders],
    queryFn: async () => {
      const [events, tasks] = await Promise.all([
        api.events.dueReminders(),
        api.tasks.dueReminders(),
      ]);
      return { events, tasks };
    },
    enabled,
    refetchInterval: enabled ? 30_000 : false,
    retry: false,
  });
}

export function useConnections() {
  return useQuery({
    queryKey: queryKeys.sharing.connections,
    queryFn: () => api.sharing.connections(),
  });
}

export function useInvitesSent() {
  return useQuery({
    queryKey: queryKeys.sharing.invites,
    queryFn: () => api.sharing.invitesSent(),
  });
}

export function useSharingMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.sharing.root });
  };

  return {
    invite: useMutation({
      mutationFn: (email: string) => api.sharing.invite(email),
      onSuccess: invalidate,
    }),
    accept: useMutation({
      mutationFn: (id: number) => api.sharing.accept(id),
      onSuccess: invalidate,
    }),
    decline: useMutation({
      mutationFn: (id: number) => api.sharing.decline(id),
      onSuccess: invalidate,
    }),
    share: useMutation({
      mutationFn: (body: {
        to_user_id: number;
        item_type: ShareableType;
        item_id: number;
        message?: string;
      }) => api.sharing.share(body),
      onSuccess: invalidate,
    }),
    acceptFromNotification: useMutation({
      mutationFn: (notificationId: number) =>
        api.sharing.acceptInviteFromNotification(notificationId),
      onSuccess: invalidate,
    }),
    markNotificationRead: useMutation({
      mutationFn: (id: number) => api.sharing.markNotificationRead(id),
      onSuccess: invalidate,
    }),
    markShareRead: useMutation({
      mutationFn: (id: number) => api.sharing.markShareRead(id),
      onSuccess: invalidate,
    }),
  };
}

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.sharing.notifications,
    queryFn: () => api.sharing.notifications(),
    refetchInterval: 30_000,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.sharing.unread,
    queryFn: () => api.sharing.unreadCount(),
    refetchInterval: 30_000,
  });
}

export function useSharedInbox() {
  return useQuery({
    queryKey: queryKeys.sharing.inbox,
    queryFn: () => api.sharing.inbox(),
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard.all,
    queryFn: async () => {
      const [tasks, notes, plans, events] = await Promise.all([
        api.tasks.today(),
        api.notes.list(),
        api.plans.list(),
        api.events.list(),
      ]);
      const now = Date.now();
      return {
        tasks,
        notesCount: notes.length,
        plans: plans.filter((x) => x.status === "active").slice(0, 5),
        events: events
          .filter((ev) => isUpcomingEvent(ev, now))
          .sort(
            (a, b) =>
              (eventUpcomingTimestamp(a, now) ?? Infinity) -
              (eventUpcomingTimestamp(b, now) ?? Infinity)
          )
          .slice(0, 5),
      };
    },
  });
}
