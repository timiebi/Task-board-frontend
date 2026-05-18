"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
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

export function useTaskMutations(filter: "today" | "daily" | "all") {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.root });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  };

  const create = useMutation({
    mutationFn: (body: Partial<Task>) => api.tasks.create(body),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<Task> }) =>
      api.tasks.update(id, body),
    onSuccess: invalidate,
  });
  const toggleComplete = useMutation({
    mutationFn: (id: number) => api.tasks.toggleComplete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.root });
      const snapshots = queryClient.getQueriesData<Task[]>({
        queryKey: queryKeys.tasks.root,
      });
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
    onError: (_err, _id, context) => {
      context?.snapshots.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      invalidate();
    },
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.tasks.delete(id),
    onSuccess: invalidate,
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

export function useNotebookMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.notebooks.root });

  return {
    create: useMutation({
      mutationFn: (body: Partial<Notebook>) => api.notebooks.create(body),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: number; body: Partial<Notebook> }) =>
        api.notebooks.update(id, body),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: number) => api.notebooks.delete(id),
      onSuccess: () => {
        invalidate();
        queryClient.invalidateQueries({ queryKey: queryKeys.notes.root });
      },
    }),
  };
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

export function useNoteMutations(notebook: number | null) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.notes.root });

  return {
    create: useMutation({
      mutationFn: (body: Partial<Note>) => api.notes.create(body),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: number; body: Partial<Note> }) =>
        api.notes.update(id, body),
      onSuccess: () => {
        invalidate();
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      },
    }),
    remove: useMutation({
      mutationFn: (id: number) => api.notes.delete(id),
      onSuccess: invalidate,
    }),
  };
}

export function usePlans() {
  return useQuery({
    queryKey: queryKeys.plans.all,
    queryFn: () => api.plans.list(),
  });
}

export function usePlanMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.plans.root });

  return {
    create: useMutation({
      mutationFn: (body: Partial<Plan>) => api.plans.create(body),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: number; body: Partial<Plan> }) =>
        api.plans.update(id, body),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: number) => api.plans.delete(id),
      onSuccess: invalidate,
    }),
  };
}

export function useEvents() {
  return useQuery({
    queryKey: queryKeys.events.all,
    queryFn: () => api.events.list(),
  });
}

export function useEventMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.events.root });

  return {
    create: useMutation({
      mutationFn: (body: Partial<Event>) => api.events.create(body),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: number; body: Partial<Event> }) =>
        api.events.update(id, body),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: number) => api.events.delete(id),
      onSuccess: invalidate,
    }),
    markNotified: useMutation({
      mutationFn: (id: number) => api.events.markNotified(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.events.dueReminders });
      },
    }),
  };
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
      const now = new Date();
      return {
        tasks,
        notesCount: notes.length,
        plans: plans.filter((x) => x.status === "active").slice(0, 5),
        events: events
          .filter((ev) => new Date(ev.starts_at) >= now)
          .slice(0, 5),
      };
    },
  });
}
