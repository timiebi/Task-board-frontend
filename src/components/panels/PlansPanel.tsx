"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Plan } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Modal } from "../Modal";
import { ConfirmModal } from "../ui/ConfirmModal";
import { EmptyState } from "../ui/EmptyState";
import { PageShell } from "../ui/PageShell";
import { SurfacePanel } from "../ui/SurfacePanel";

const emptyPlan = (): Partial<Plan> => ({
  title: "",
  content: "",
  start_date: null,
  end_date: null,
  status: "active",
});

const statusStyle: Record<Plan["status"], { color: string; bg: string }> = {
  draft: { color: "var(--muted)", bg: "var(--surface-raised)" },
  active: { color: "var(--accent)", bg: "var(--accent-soft)" },
  done: { color: "var(--success)", bg: "var(--success-soft)" },
};

export function PlansPanel() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Plan> | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPlans(await api.plans.list());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(emptyPlan());
    setModalOpen(true);
  };

  const save = async () => {
    if (!editing?.title?.trim()) return;
    if (editing.id) await api.plans.update(editing.id, editing);
    else await api.plans.create(editing);
    setModalOpen(false);
    load();
  };

  const remove = async (id: number) => {
    await api.plans.delete(id);
    setDeleteId(null);
    load();
  };

  return (
    <PageShell
      title="Plans"
      subtitle="Bigger goals and projects"
      action={
        <button type="button" onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" /> New plan
        </button>
      }
    >
      <SurfacePanel
        toolbarTitle={loading ? "Loading…" : `${plans.length} plans`}
        bodyClassName={!loading && plans.length > 0 ? "surface-body--grid" : ""}
      >
        {loading ? (
          <p className="surface-loading">Loading plans…</p>
        ) : plans.length === 0 ? (
          <EmptyState
            variant="plans"
            action={
              <button type="button" onClick={openCreate} className="btn-primary">
                <Plus className="h-4 w-4" /> Create plan
              </button>
            }
          />
        ) : (
          <>
            {plans.map((plan) => (
              <article key={plan.id} className="surface-plan-card">
                <div className="surface-item-row">
                  <h3 className="surface-item-title">{plan.title}</h3>
                  <span
                    className="badge text-xs capitalize"
                    style={{
                      color: statusStyle[plan.status].color,
                      background: statusStyle[plan.status].bg,
                      borderColor: "transparent",
                    }}
                  >
                    {plan.status}
                  </span>
                </div>
                {(plan.start_date || plan.end_date) && (
                  <p className="surface-item-meta" style={{ marginBottom: 8 }}>
                    {formatDate(plan.start_date)} → {formatDate(plan.end_date)}
                  </p>
                )}
                <p className="surface-item-preview surface-item-preview--clamp">
                  {plan.content || "No details yet."}
                </p>
                <div className="surface-plan-actions">
                  <button
                    type="button"
                    className="btn-ghost text-xs"
                    onClick={() => {
                      setEditing({ ...plan });
                      setModalOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="surface-icon-btn is-danger"
                    onClick={() => setDeleteId(plan.id)}
                    aria-label="Delete plan"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </>
        )}
      </SurfacePanel>

      <Modal
        title={editing?.id ? "Edit plan" : "New plan"}
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
            <label className="label">Content</label>
            <textarea
              className="input min-h-[160px]"
              value={editing?.content ?? ""}
              onChange={(e) => setEditing((x) => ({ ...x!, content: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start date</label>
              <input
                type="date"
                className="input"
                value={editing?.start_date ?? ""}
                onChange={(e) =>
                  setEditing((x) => ({ ...x!, start_date: e.target.value || null }))
                }
              />
            </div>
            <div>
              <label className="label">End date</label>
              <input
                type="date"
                className="input"
                value={editing?.end_date ?? ""}
                onChange={(e) =>
                  setEditing((x) => ({ ...x!, end_date: e.target.value || null }))
                }
              />
            </div>
          </div>
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={editing?.status ?? "active"}
              onChange={(e) =>
                setEditing((x) => ({
                  ...x!,
                  status: e.target.value as Plan["status"],
                }))
              }
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
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
        title="Delete plan?"
        message="This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => deleteId !== null && void remove(deleteId)}
        onClose={() => setDeleteId(null)}
      />
    </PageShell>
  );
}
