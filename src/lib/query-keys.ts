export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  tasks: {
    root: ["tasks"] as const,
    list: (filter: "today" | "daily" | "all") => ["tasks", "list", filter] as const,
  },
  notebooks: {
    root: ["notebooks"] as const,
    all: ["notebooks", "list"] as const,
  },
  notes: {
    root: ["notes"] as const,
    list: (notebook: number | null) => ["notes", "list", notebook] as const,
  },
  plans: {
    root: ["plans"] as const,
    all: ["plans", "list"] as const,
  },
  events: {
    root: ["events"] as const,
    all: ["events", "list"] as const,
    dueReminders: ["events", "due-reminders"] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
  },
};
