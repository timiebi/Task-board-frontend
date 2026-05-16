"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Task } from "@/lib/types";
import {
  formatDateTime,
  fromDatetimeLocalValue,
  isOverdue,
  priorityBadgeClass,
  toDatetimeLocalValue,
} from "@/lib/utils";
import { Modal } from "../Modal";
import { ConfirmModal } from "../ui/ConfirmModal";
import { EmptyState } from "../ui/EmptyState";
import { FilterPills } from "../ui/FilterPills";
import { PageShell } from "../ui/PageShell";
import { SurfacePanel } from "../ui/SurfacePanel";

const emptyTask = (): Partial<Task> => ({
  title: "",
  description: "",
  due_date: null,
  priority: "medium",
  status: "todo",
  is_daily: false,
  completed: false,
});

export function TasksPanel() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<"today" | "daily" | "all">("today");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Task> | null>(null);
  const [dueLocal, setDueLocal] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let data: Task[];
      if (filter === "today") data = await api.tasks.today();
      else if (filter === "daily") data = await api.tasks.list({ daily: true });
      else data = await api.tasks.list();
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(emptyTask());
    setDueLocal("");
    setModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditing({ ...task });
    setDueLocal(toDatetimeLocalValue(task.due_date));
    setModalOpen(true);
  };

  const save = async () => {
    if (!editing?.title?.trim()) return;
    const body = {
      ...editing,
      due_date: fromDatetimeLocalValue(dueLocal),
    };
    if (editing.id) await api.tasks.update(editing.id, body);
    else await api.tasks.create(body);
    setModalOpen(false);
    load();
  };

  const toggle = async (id: number) => {
    await api.tasks.toggleComplete(id);
    load();
  };

  const remove = async (id: number) => {
    await api.tasks.delete(id);
    setDeleteId(null);
    load();
  };

  const filterLabel =
    filter === "today" ? "Today" : filter === "daily" ? "Daily habits" : "All tasks";

  return (
    <PageShell
      title="Tasks"
      subtitle="What you need to do"
      action={
        <button type="button" onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" /> New task
        </button>
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
        ) : tasks.length === 0 ? (
          <EmptyState
            variant="tasks"
            action={
              <button type="button" onClick={openCreate} className="btn-primary">
                <Plus className="h-4 w-4" /> Add task
              </button>
            }
          />
        ) : (
          <ul className="surface-list">
            {tasks.map((task) => (
              <li key={task.id}>
                <div
                  className={`surface-item surface-item--row ${
                    task.completed ? "is-done" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggle(task.id)}
                    className="surface-checkbox"
                    aria-label={`Mark "${task.title}" complete`}
                  />
                  <div className="surface-item-main">
                    <button
                      type="button"
                      onClick={() => openEdit(task)}
                      className={`surface-item-title ${
                        task.completed ? "line-through" : ""
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
                  <button
                    type="button"
                    onClick={() => setDeleteId(task.id)}
                    className="surface-icon-btn is-danger"
                    aria-label="Delete task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SurfacePanel>

      <Modal
        title={editing?.id ? "Edit task" : "New task"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input
              className="input"
              value={editing?.title ?? ""}
              onChange={(e) => setEditing((x) => ({ ...x!, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              value={editing?.description ?? ""}
              onChange={(e) => setEditing((x) => ({ ...x!, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Priority</label>
              <select
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
              <label className="label">Status</label>
              <select
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
          <div>
            <label className="label">Deadline</label>
            <input
              type="datetime-local"
              className="input"
              value={dueLocal}
              onChange={(e) => setDueLocal(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={editing?.is_daily ?? false}
              onChange={(e) => setEditing((x) => ({ ...x!, is_daily: e.target.checked }))}
            />
            Show on daily list every day
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={save}>
              Save
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={deleteId !== null}
        title="Delete task?"
        message="This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => deleteId !== null && void remove(deleteId)}
        onClose={() => setDeleteId(null)}
      />
    </PageShell>
  );
}
