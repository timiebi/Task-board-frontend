"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { downloadTasksCsv, downloadTasksPdf } from "@/lib/export-tasks";
import { ApiError } from "@/lib/api";
import { USER_MESSAGES } from "@/lib/user-messages";
import { sortTasksByUrgency } from "@/lib/utils";
import { Button } from "./Button";

export function ExportTasksButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runExport = async (format: "csv" | "pdf") => {
    setExporting(format);
    setError(null);
    setOpen(false);
    try {
      const tasks = sortTasksByUrgency(await api.tasks.list());
      if (tasks.length === 0) {
        setError("You don't have any tasks to download yet.");
        return;
      }
      const username = user?.username;
      if (format === "csv") downloadTasksCsv(tasks, username);
      else await downloadTasksPdf(tasks, username);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : USER_MESSAGES.generic);
    } finally {
      setExporting(null);
    }
  };

  const busy = exporting !== null;

  return (
    <div className="export-tasks">
      <div className="export-tasks-trigger">
        <Button
          type="button"
          variant="ghost"
          loading={busy}
          disabled={busy}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <Download className="h-4 w-4" />
          {busy ? "Exporting…" : "Export"}
        </Button>
      </div>
      {open && (
        <>
          <button
            type="button"
            className="export-tasks-backdrop"
            aria-label="Close export menu"
            onClick={() => setOpen(false)}
          />
          <div className="export-tasks-menu" role="menu">
            <button
              type="button"
              className="export-tasks-option"
              role="menuitem"
              onClick={() => void runExport("csv")}
            >
              <FileSpreadsheet className="h-4 w-4" aria-hidden />
              <span>
                <strong>Spreadsheet (CSV)</strong>
                <small>Open in Excel, Google Sheets, or Numbers</small>
              </span>
            </button>
            <button
              type="button"
              className="export-tasks-option"
              role="menuitem"
              onClick={() => void runExport("pdf")}
            >
              <FileText className="h-4 w-4" aria-hidden />
              <span>
                <strong>PDF document</strong>
                <small>Printable list to email or share</small>
              </span>
            </button>
          </div>
        </>
      )}
      {error && (
        <p className="export-tasks-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
