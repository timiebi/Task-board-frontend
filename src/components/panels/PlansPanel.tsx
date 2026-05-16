"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { usePlanMutations, usePlans } from "@/hooks/queries";
import type { Plan } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Modal } from "../Modal";
import { Button } from "../ui/Button";
import { ConfirmModal } from "../ui/ConfirmModal";
import { DateField } from "../ui/DateField";
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
  const { data: plans = [], isLoading: loading } = usePlans();
  const { create, update, remove } = usePlanMutations();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Plan> | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const saving = create.isPending || update.isPending;

  const openCreate = () => {
    setEditing(emptyPlan());
    setModalOpen(true);
  };

  const save = async () => {
    if (!editing?.title?.trim()) return;
    if (editing.id) await update.mutateAsync({ id: editing.id, body: editing });
    else await create.mutateAsync(editing);
    setModalOpen(false);
  };

  const removePlan = async (id: number) => {
    await remove.mutateAsync(id);
    setDeleteId(null);
  };

  return (
    <PageShell
      title="Plans"
      subtitle="Bigger goals and projects"
      action={
        <Button type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" /> New plan
        </Button>
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
              <Button type="button" onClick={openCreate}>
                <Plus className="h-4 w-4" /> Create plan
              </Button>
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
            <label className="label" htmlFor="plan-title">
              Title
            </label>
            <input
              id="plan-title"
              className="input"
              value={editing?.title ?? ""}
              onChange={(e) => setEditing((x) => ({ ...x!, title: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="plan-content">
              Content
            </label>
            <textarea
              id="plan-content"
              className="input min-h-[160px]"
              rows={6}
              value={editing?.content ?? ""}
              onChange={(e) => setEditing((x) => ({ ...x!, content: e.target.value }))}
            />
          </div>
          <div className="form-row-2">
            <DateField
              id="plan-start"
              label="Start date"
              value={editing?.start_date ?? ""}
              onChange={(v) => setEditing((x) => ({ ...x!, start_date: v || null }))}
              optional
            />
            <DateField
              id="plan-end"
              label="End date"
              value={editing?.end_date ?? ""}
              onChange={(v) => setEditing((x) => ({ ...x!, end_date: v || null }))}
              optional
            />
          </div>
          <div>
            <label className="label" htmlFor="plan-status">
              Status
            </label>
            <select
              id="plan-status"
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
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save plan
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={deleteId !== null}
        title="Delete plan?"
        message="This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={remove.isPending}
        onConfirm={() => deleteId !== null && void removePlan(deleteId)}
        onClose={() => setDeleteId(null)}
      />
    </PageShell>
  );
}
