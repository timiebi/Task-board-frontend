"use client";

import { useEffect, useState } from "react";
import { IonIcon } from "@ionic/react";
import {
  addOutline,
  arrowBackOutline,
  bookOutline,
  chevronForwardOutline,
  createOutline,
  ellipsisHorizontalOutline,
  pin,
  trashOutline,
} from "ionicons/icons";
import {
  useNotebookMutations,
  useNoteMutations,
  useNotebooks,
  useNotes,
} from "@/hooks/queries";
import { consumePendingFocusForTab, focusByDataTarget } from "@/lib/pending-focus";
import type { Note, Notebook } from "@/lib/types";
import { relativeTime } from "@/lib/utils";
import { ShareItemButton } from "../sharing/ShareItemButton";
import { ConfirmModal } from "../ui/ConfirmModal";
import { EmptyState } from "../ui/EmptyState";
import { PageShell } from "../ui/PageShell";
import { PromptModal } from "../ui/PromptModal";

function notePreview(content: string, max = 80): string {
  const text = content.replace(/\s+/g, " ").trim();
  if (!text) return "No content";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function NotesPanel() {
  const [selectedNotebook, setSelectedNotebook] = useState<number | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const { data: notebooks = [] } = useNotebooks();
  const { data: notes = [], isLoading: loading } = useNotes(selectedNotebook);
  const notebookMutations = useNotebookMutations();
  const noteMutations = useNoteMutations(selectedNotebook);
  const [mobilePane, setMobilePane] = useState<"list" | "editor">("list");
  const [notebookMenuId, setNotebookMenuId] = useState<number | null>(null);
  const [showNewNotebook, setShowNewNotebook] = useState(false);
  const [editNotebook, setEditNotebook] = useState<Notebook | null>(null);
  const [editNotebookName, setEditNotebookName] = useState("");
  const [deleteNotebookId, setDeleteNotebookId] = useState<number | null>(null);
  const [deleteNoteOpen, setDeleteNoteOpen] = useState(false);

  const selectedNotebookName =
    selectedNotebook === null
      ? "All notes"
      : notebooks.find((n) => n.id === selectedNotebook)?.name ?? "Notebook";

  useEffect(() => {
    setSelectedNote((prev) => {
      if (!notes.length) return null;
      if (prev && notes.find((n) => n.id === prev.id)) return prev;
      return notes[0];
    });
  }, [notes]);

  useEffect(() => {
    const target = consumePendingFocusForTab("notes");
    if (!target) return;
    const note = notes.find((n) => n.id === target.id);
    if (note) {
      setSelectedNote(note);
      setMobilePane("editor");
    }
    const focused = focusByDataTarget(target.type, target.id);
    if (!focused) {
      window.setTimeout(() => {
        void focusByDataTarget(target.type, target.id);
      }, 220);
    }
  }, [notes]);

  const selectNote = (note: Note) => {
    setSelectedNote(note);
    setMobilePane("editor");
  };

  const selectNotebook = (id: number | null) => {
    setSelectedNotebook(id);
    setNotebookMenuId(null);
  };

  const createNotebook = (name: string) => {
    if (!name.trim()) return;
    setShowNewNotebook(false);
    notebookMutations.create.mutate(
      { name: name.trim() },
      { onSuccess: (nb) => setSelectedNotebook(nb.id) }
    );
  };

  const renameNotebook = (name: string) => {
    if (!editNotebook || !name.trim()) return;
    setEditNotebook(null);
    void notebookMutations.update.mutate({
      id: editNotebook.id,
      body: { name: name.trim() },
    });
  };

  const deleteNotebook = (id: number) => {
    if (selectedNotebook === id) setSelectedNotebook(null);
    setDeleteNotebookId(null);
    setNotebookMenuId(null);
    void notebookMutations.remove.mutate(id);
  };

  const createNote = () => {
    noteMutations.create.mutate(
      {
        title: "Untitled note",
        content: "",
        notebook: selectedNotebook,
      },
      { onSuccess: (note) => selectNote(note) }
    );
  };

  const updateNote = (patch: Partial<Note>) => {
    if (!selectedNote) return;
    const next = { ...selectedNote, ...patch };
    setSelectedNote(next);
    void noteMutations.update.mutate({
      id: selectedNote.id,
      body: patch,
    });
  };

  const deleteNote = () => {
    if (!selectedNote) return;
    const id = selectedNote.id;
    setSelectedNote(null);
    setMobilePane("list");
    setDeleteNoteOpen(false);
    void noteMutations.remove.mutate(id);
  };

  return (
    <PageShell
      title="Notes"
      subtitle="Notebooks and notes"
      action={
        <button type="button" className="btn-primary" onClick={createNote}>
          <IonIcon icon={addOutline} /> New note
        </button>
      }
    >

      <div
        className={`notes-layout ${mobilePane === "editor" ? "notes-layout--editor" : ""}`}
      >
        {/* ── Notebooks column ── */}
        <aside className="notes-col notes-col--books">
          <div className="notes-col-header">
            <span className="notes-col-title">
              <IonIcon icon={bookOutline} /> Notebooks
            </span>
            <button
              type="button"
              className="notes-icon-btn"
              aria-label="New notebook"
              onClick={() => setShowNewNotebook(true)}
            >
              <IonIcon icon={addOutline} />
            </button>
          </div>
          <nav className="notes-nav">
            <button
              type="button"
              className={`notes-nav-item ${selectedNotebook === null ? "is-active" : ""}`}
              onClick={() => selectNotebook(null)}
            >
              <span className="notes-nav-label">All notes</span>
              <span className="notes-nav-meta">{notes.length}</span>
            </button>
            {notebooks.map((nb) => (
              <div key={nb.id} className="notes-nav-row">
                <button
                  type="button"
                  className={`notes-nav-item ${selectedNotebook === nb.id ? "is-active" : ""}`}
                  onClick={() => selectNotebook(nb.id)}
                >
                  <span className="notes-nav-label">{nb.name}</span>
                  <span className="notes-nav-meta">{nb.note_count}</span>
                </button>
                <button
                  type="button"
                  className="notes-icon-btn notes-icon-btn--sm"
                  aria-label="Notebook options"
                  onClick={() =>
                    setNotebookMenuId(notebookMenuId === nb.id ? null : nb.id)
                  }
                >
                  <IonIcon icon={ellipsisHorizontalOutline} />
                </button>
                {notebookMenuId === nb.id && (
                  <div className="notes-dropdown">
                    <button
                      type="button"
                      onClick={() => {
                        setEditNotebook(nb);
                        setEditNotebookName(nb.name);
                        setNotebookMenuId(null);
                      }}
                    >
                      <IonIcon icon={createOutline} /> Rename
                    </button>
                    <button
                      type="button"
                      className="is-danger"
                      onClick={() => {
                        setDeleteNotebookId(nb.id);
                        setNotebookMenuId(null);
                      }}
                    >
                      <IonIcon icon={trashOutline} /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* ── Notes list column ── */}
        <aside className="notes-col notes-col--list">
          <div className="notes-col-header">
            <span className="notes-col-title">{selectedNotebookName}</span>
            <button
              type="button"
              className="notes-icon-btn"
              aria-label="New note in this notebook"
              onClick={createNote}
            >
              <IonIcon icon={addOutline} />
            </button>
          </div>
          <div className="notes-list-scroll">
            {loading ? (
              <p className="notes-loading">Loading notes…</p>
            ) : notes.length === 0 ? (
              <EmptyState
                variant="notes"
                compact
                action={
                  <button type="button" className="btn-primary" onClick={createNote}>
                    Create note
                  </button>
                }
              />
            ) : (
              <ul className="notes-list">
                {notes.map((note) => (
                  <li key={note.id}>
                    <button
                      type="button"
                      className={`notes-list-item ${
                        selectedNote?.id === note.id ? "is-active" : ""
                      }`}
                      onClick={() => selectNote(note)}
                      data-focus-type="note"
                      data-focus-id={note.id}
                    >
                      <div className="notes-list-item-top">
                        {note.is_pinned && (
                          <IonIcon icon={pin} className="notes-pin" />
                        )}
                        <span className="notes-list-title">
                          {note.title || "Untitled"}
                        </span>
                        <IonIcon icon={chevronForwardOutline} className="notes-chevron" />
                      </div>
                      <p className="notes-list-preview">{notePreview(note.content)}</p>
                      <span className="notes-list-time">
                        {relativeTime(note.updated_at)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* ── Editor column ── */}
        <section className="notes-col notes-col--editor">
          {selectedNote ? (
            <>
              <div className="notes-editor-header">
                <button
                  type="button"
                  className="notes-back-btn notes-show-mobile"
                  onClick={() => setMobilePane("list")}
                >
                  <IonIcon icon={arrowBackOutline} /> Back
                </button>
                <input
                  className="notes-title-input"
                  value={selectedNote.title}
                  placeholder="Note title"
                  onChange={(e) =>
                    setSelectedNote({ ...selectedNote, title: e.target.value })
                  }
                  onBlur={() => updateNote({ title: selectedNote.title })}
                />
                <div className="notes-editor-actions">
                  <select
                    className="notes-select"
                    value={selectedNote.notebook ?? ""}
                    onChange={(e) =>
                      updateNote({
                        notebook: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  >
                    <option value="">No notebook</option>
                    {notebooks.map((nb) => (
                      <option key={nb.id} value={nb.id}>
                        {nb.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={`notes-icon-btn ${selectedNote.is_pinned ? "is-pinned" : ""}`}
                    title={selectedNote.is_pinned ? "Unpin" : "Pin note"}
                    onClick={() => updateNote({ is_pinned: !selectedNote.is_pinned })}
                  >
                    <IonIcon icon={pin} />
                  </button>
                  <span className="notes-share-wrap">
                    <ShareItemButton
                      itemType="note"
                      itemId={selectedNote.id}
                      itemTitle={selectedNote.title || "Untitled"}
                    />
                  </span>
                  <button
                    type="button"
                    className="notes-icon-btn is-danger"
                    title="Delete note"
                    onClick={() => setDeleteNoteOpen(true)}
                  >
                    <IonIcon icon={trashOutline} />
                  </button>
                </div>
              </div>
              <div className="notes-editor-body">
                <textarea
                  className="notes-content-input"
                  value={selectedNote.content}
                  placeholder="Start writing…"
                  onChange={(e) =>
                    setSelectedNote({ ...selectedNote, content: e.target.value })
                  }
                  onBlur={() => updateNote({ content: selectedNote.content })}
                />
              </div>
              <p className="notes-save-hint">Saves when you leave a field.</p>
            </>
          ) : (
            <EmptyState
              variant="notes"
              title="Select a note"
              description="Pick one from the list or start a new note."
            />
          )}
        </section>
      </div>

      <PromptModal
        open={showNewNotebook}
        title="New notebook"
        label="Name"
        placeholder="Work, Personal…"
        confirmLabel="Create"
        onConfirm={(name) => void createNotebook(name)}
        onClose={() => setShowNewNotebook(false)}
      />

      <PromptModal
        open={!!editNotebook}
        title="Rename notebook"
        label="Name"
        placeholder="Name"
        defaultValue={editNotebookName}
        confirmLabel="Save"
        onConfirm={(name) => void renameNotebook(name)}
        onClose={() => setEditNotebook(null)}
      />

      <ConfirmModal
        open={deleteNotebookId !== null}
        title="Delete notebook?"
        message="All notes inside will be deleted permanently."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (deleteNotebookId) void deleteNotebook(deleteNotebookId);
        }}
        onClose={() => setDeleteNotebookId(null)}
      />

      <ConfirmModal
        open={deleteNoteOpen}
        title="Delete note?"
        message="This note will be deleted permanently."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => void deleteNote()}
        onClose={() => setDeleteNoteOpen(false)}
      />
    </PageShell>
  );
}
