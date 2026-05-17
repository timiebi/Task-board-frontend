import type { Task } from "./types";
import { formatDateTime, sortTasksByUrgency } from "./utils";

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function taskRow(task: Task): string[] {
  return [
    task.title,
    task.description,
    task.due_date ? formatDateTime(task.due_date) : "",
    task.remind_at ? formatDateTime(task.remind_at) : "",
    task.priority,
    task.status,
    task.completed ? "Yes" : "No",
    task.is_daily ? "Yes" : "No",
    formatDateTime(task.created_at),
    formatDateTime(task.updated_at),
  ];
}

const CSV_HEADERS = [
  "Title",
  "Description",
  "Due date",
  "Remind at",
  "Priority",
  "Status",
  "Completed",
  "Daily",
  "Created",
  "Updated",
];

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportFilename(ext: string, username?: string) {
  const date = new Date().toISOString().slice(0, 10);
  const who = username ? `-${username.replace(/[^\w.-]+/g, "_")}` : "";
  return `task-board-tasks${who}-${date}.${ext}`;
}

export function downloadTasksCsv(tasks: Task[], username?: string) {
  const sorted = sortTasksByUrgency(tasks);
  const lines = [
    CSV_HEADERS.map(escapeCsvCell).join(","),
    ...sorted.map((t) => taskRow(t).map(escapeCsvCell).join(",")),
  ];
  const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], {
    type: "text/csv;charset=utf-8",
  });
  downloadBlob(blob, exportFilename("csv", username));
}

export async function downloadTasksPdf(tasks: Task[], username?: string) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const sorted = sortTasksByUrgency(tasks);
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const exportedAt = formatDateTime(new Date().toISOString());

  doc.setFontSize(16);
  doc.text("Task Board — Tasks", 40, 36);
  doc.setFontSize(10);
  doc.setTextColor(100);
  const subtitle = [
    username ? `Exported by ${username}` : null,
    `Generated ${exportedAt}`,
    `${sorted.length} task${sorted.length === 1 ? "" : "s"}`,
  ]
    .filter(Boolean)
    .join(" · ");
  doc.text(subtitle, 40, 52);

  autoTable(doc, {
    startY: 64,
    head: [CSV_HEADERS],
    body: sorted.map(taskRow),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 40, right: 40 },
  });

  doc.save(exportFilename("pdf", username));
}
