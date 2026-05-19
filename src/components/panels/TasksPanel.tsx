"use client";

import { useMemo, useState } from "react";
import { Bell, Plus, Trash2 } from "lucide-react";
import { ShareItemButton } from "../sharing/ShareItemButton";
import { useReminderNotifyGate } from "@/hooks/useReminderNotifyGate";
import { useTaskMutations, useTasks } from "@/hooks/queries";
import { hasActiveNotifications } from "@/lib/notifications-ready";
import type { Task } from "@/lib/types";
import {
  formatDateTime,
  fromDatetimeLocalValue,
  isOverdue,
  partitionTasks,
  priorityBadgeClass,
  toDatetimeLocalValue,
} from "@/lib/utils";
import { Modal } from "../Modal";
import { Button } from "../ui/Button";
import { ConfirmModal } from "../ui/ConfirmModal";
import { ReminderNotifyModal } from "../ui/ReminderNotifyModal";
import { DateTimeField } from "../ui/DateTimeField";
import { EmptyState } from "../ui/EmptyState";
import { FilterPills } from "../ui/FilterPills";
import { ExportTasksButton } from "../ui/ExportTasksButton";
import { PageShell } from "../ui/PageShell";
import { SurfacePanel } from "../ui/SurfacePanel";

const emptyTask = (): Partial<Task> => ({
  title: "",
  description: "",
  due_date: null,
  remind_at: null,
  reminded: false,
  priority: "medium",
  status: "todo",
  is_daily: false,
  completed: false,
});

export function TasksPanel() {
  const [filter, setFilter] = useState<"today" | "daily" | "all">("today");
  const { data: tasks = [], isLoading: loading } = useTasks(filter);
  const { create, update, toggleComplete, remove } = useTaskMutations(filter);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Task> | null>(null);
  const [dueLocal, setDueLocal] = useState("");
  const [remindLocal, setRemindLocal] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const notifyGate = useReminderNotifyGate();

  const saving = create.isPending || update.isPending;
  const { overdue, active, done } = useMemo(() => partitionTasks(tasks), [tasks]);
  const hasAnyTasks = overdue.length + active.length + done.length > 0;

  const openCreate = () => {
    setEditing(emptyTask());
    setDueLocal("");
    setRemindLocal("");
    setReminderEnabled(false);
    setModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditing({ ...task });
    setDueLocal(toDatetimeLocalValue(task.due_date));
    setRemindLocal(toDatetimeLocalValue(task.remind_at));
    setReminderEnabled(!!task.remind_at);
    setModalOpen(true);
  };

  const persistTask = () => {
    if (!editing?.title?.trim()) return;
    const status = editing.status ?? "todo";
    const newRemindAt = reminderEnabled ? fromDatetimeLocalValue(remindLocal) : null;
    const previousRemindAt = editing.remind_at ?? null;
    const remindAtChanged = newRemindAt !== previousRemindAt;
    const body: Partial<Task> = {
      ...editing,
      status,
      completed: status === "done",
      due_date: fromDatetimeLocalValue(dueLocal),
      remind_at: newRemindAt,
    };
    if (remindAtChanged && newRemindAt) {
      body.reminded = false;
    }
    setModalOpen(false);
    if (editing.id) void update.mutate({ id: editing.id, body });
    else void create.mutate(body);
  };

  const save = () => {
    if (!editing?.title?.trim()) return;
    const hasReminder = reminderEnabled && !!remindLocal.trim();
    if (hasReminder && !hasActiveNotifications()) {
      notifyGate.gate(() => persistTask());
      return;
    }
    persistTask();
  };

  const onReminderToggle = (checked: boolean) => {
    if (!checked) {
      setReminderEnabled(false);
      return;
    }
    if (hasActiveNotifications()) {
      setReminderEnabled(true);
      return;
    }
    notifyGate.gate(() => setReminderEnabled(true));
  };

  const filterLabel =
    filter === "today" ? "Today" : filter === "daily" ? "Daily habits" : "All tasks";

  return (
    <PageShell
      title="Tasks"
      subtitle="What you need to do"
      action={
        <div className="page-header-actions">
          <ExportTasksButton />
          <Button type="button" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New task
          </Button>
        </div>
      }
    >
      <SurfacePanel
        toolbarTitle={filterLabel}
        toolbar={
          <FilterPills
            value={filter}
            onChange={setFilter}
            options={[
              { value: "today", label: "Today" },
              { value: "daily", label: "Daily" },
              { value: "all", label: "All" },
            ]}
          />
        }
      >
        {loading ? (
          <p className="surface-loading">Loading tasks…</p>
        ) : !hasAnyTasks ? (
          <EmptyState
            variant="tasks"
            action={
              <Button type="button" onClick={openCreate}>
                <Plus className="h-4 w-4" /> Add task
              </Button>
            }
          />
        ) : (
          <div className="task-list-sections">
            <TaskListSection
              title="Overdue"
              variant="overdue"
              tasks={overdue}
              toggleComplete={toggleComplete}
              onEdit={openEdit}
              onDelete={setDeleteId}
            />
            <TaskListSection
              title="Tasks"
              tasks={active}
              toggleComplete={toggleComplete}
              onEdit={openEdit}
              onDelete={setDeleteId}
            />
            <TaskListSection
              title="Done"
              variant="done"
              tasks={done}
              toggleComplete={toggleComplete}
              onEdit={openEdit}
              onDelete={setDeleteId}
            />
          </div>
        )}
      </SurfacePanel>

      <Modal
        title={editing?.id ? "Edit task" : "New task"}
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
      >
        <form
          className="modal-form"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <div>
            <label className="label" htmlFor="task-title"> Title</label>
            <input
              id="task-title"
              className="input"
              value={editing?.title ?? ""}
              onChange={(e) => setEditing((x) => ({ ...x!, title: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="task-desc">
              Description
            </label>
            <textarea
              id="task-desc"
              className="input"
              rows={3}
              value={editing?.description ?? ""}
              onChange={(e) =>
                setEditing((x) => ({ ...x!, description: e.target.value }))
              }
            />
          </div>
          <div className="form-row-2">
            <div>
              <label className="label" htmlFor="task-priority">
                Priority
              </label>
              <select
                id="task-priority"
                className="input"
                value={editing?.priority ?? "medium"}
                onChange={(e) =>
                  setEditing((x) => ({
                    ...x!,
                    priority: e.target.value as Task["priority"],
                  }))
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="task-status">
                Status
              </label>
              <select
                id="task-status"
                className="input"
                value={editing?.status ?? "todo"}
                onChange={(e) =>
                  setEditing((x) => ({
                    ...x!,
                    status: e.target.value as Task["status"],
                  }))
                }
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
          <DateTimeField
            id="task-due"
            label="Deadline"
            hint="When this task is due"
            value={dueLocal}
            onChange={setDueLocal}
            optional
          />
          <div className="reminder-toggle-card">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => onReminderToggle(e.target.checked)}
              />
              <span>
                <strong>Remind me</strong>
                <span className="checkbox-row-hint">
                  Pick a time and we'll nudge you when it's due
                </span>
              </span>
            </label>
            {reminderEnabled && (
              <DateTimeField
                id="task-remind"
                label="Remind me at"
                value={remindLocal}
                onChange={setRemindLocal}
              />
            )}
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={editing?.is_daily ?? false}
              onChange={(e) => setEditing((x) => ({ ...x!, is_daily: e.target.checked }))}
            />
            <span>Show on daily list every day</span>
          </label>
          <div className="modal-actions">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save task
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={deleteId !== null}
        title="Delete task?"
        message="This task will be deleted permanently."
        confirmLabel="Delete"
        variant="danger"
        loading={remove.isPending}
        onConfirm={() => {
          if (deleteId === null) return;
          const id = deleteId;
          setDeleteId(null);
          void remove.mutate(id);
        }}
        onClose={() => setDeleteId(null)}
      />

      <ReminderNotifyModal
        open={notifyGate.promptOpen}
        blocked={notifyGate.blocked}
        loading={notifyGate.enabling}
        onClose={notifyGate.close}
        onTurnOn={() => void notifyGate.turnOn()}
        onInAppOnly={notifyGate.inAppOnly}
      />
    </PageShell>
  );
}

type ToggleComplete = ReturnType<typeof useTaskMutations>["toggleComplete"];

function TaskListSection({
  title,
  variant,
  tasks,
  toggleComplete,
  onEdit,
  onDelete,
}: {
  title: string;
  variant?: "overdue" | "done";
  tasks: Task[];
  toggleComplete: ToggleComplete;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}) {
  if (tasks.length === 0) return null;

  return (
    <section
      className={`task-list-section${variant ? ` task-list-section--${variant}` : ""}`}
    >
      <h3 className="task-list-section-title">{title}</h3>
      <ul className="surface-list">
        {tasks.map((task) => (
          <li key={task.id}>
            <div
              className={`surface-item surface-item--row${
                task.completed ? " is-done" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => void toggleComplete.mutateAsync(task.id)}
                disabled={toggleComplete.isPending}
                className="surface-checkbox"
                aria-label={`Mark "${task.title}" complete`}
              />
              <div className="surface-item-main">
                <button
                  type="button"
                  onClick={() => onEdit(task)}
                  className={`surface-item-title${
                    task.completed ? " line-through" : ""
                  }`}
                >
                  {task.title}
                </button>
                {task.description && (
                  <p className="surface-item-preview surface-item-preview--clamp">
                    {task.description}
                  </p>
                )}
                <div className="surface-item-tags">
                  <span className={priorityBadgeClass[task.priority]}>
                    {task.priority}
                  </span>
                  {task.is_daily && <span className="badge badge-daily">daily</span>}
                  {task.remind_at && (
                    <span className="badge badge-reminder">
                      <Bell className="inline h-3 w-3" /> remind
                    </span>
                  )}
                  {task.due_date && (
                    <span
                      className="surface-item-meta"
                      style={{
                        color: isOverdue(task.due_date, task.completed)
                          ? "var(--danger)"
                          : undefined,
                      }}
                    >
                      Due {formatDateTime(task.due_date)}
                    </span>
                  )}
                </div>
              </div>
              <ShareItemButton itemType="task" itemId={task.id} itemTitle={task.title} />
              <button
                type="button"
                onClick={() => onDelete(task.id)}
                className="surface-icon-btn is-danger"
                aria-label="Delete task"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
