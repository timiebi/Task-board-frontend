"use client";

import { useRef } from "react";
import { Calendar, Clock } from "lucide-react";

interface DateTimeFieldProps {
  id?: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function todayLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function splitDatetimeLocal(value: string): { date: string; time: string } {
  if (!value?.includes("T")) return { date: "", time: "" };
  const [date, timePart] = value.split("T");
  return { date, time: (timePart ?? "").slice(0, 5) };
}

function joinDatetimeLocal(date: string, time: string): string {
  if (!date) return "";
  const t = time || "09:00";
  return `${date}T${t}`;
}

function openPicker(input: HTMLInputElement | null) {
  if (!input) return;
  input.focus();
  if (typeof input.showPicker === "function") {
    try {
      input.showPicker();
    } catch {
      /* showPicker can throw if not triggered by user gesture in some browsers */
    }
  }
}

export function DateTimeField({
  id,
  label,
  hint,
  value,
  onChange,
  optional,
}: DateTimeFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const dateRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const { date, time } = splitDatetimeLocal(value);

  const setDate = (nextDate: string) => {
    if (!nextDate) {
      onChange("");
      return;
    }
    onChange(joinDatetimeLocal(nextDate, time || "09:00"));
  };

  const setTime = (nextTime: string) => {
    if (!nextTime) {
      if (!date) {
        onChange("");
        return;
      }
      onChange(joinDatetimeLocal(date, "09:00"));
      return;
    }
    const d = date || todayLocalDate();
    onChange(joinDatetimeLocal(d, nextTime));
  };

  return (
    <div className="datetime-field">
      <label className="label" htmlFor={`${fieldId}-date`}>
        {label}
        {optional && <span className="field-optional">Optional</span>}
      </label>
      {hint && <p className="field-hint">{hint}</p>}
      <p className="field-hint datetime-field-tip">
        Type the date and time, or tap the calendar / clock icons.
      </p>
      <div className="datetime-field-combo">
        <div className="datetime-field-date-wrap">
          <input
            id={`${fieldId}-date`}
            ref={dateRef}
            type="date"
            className="input datetime-field-part"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label={`${label} date`}
          />
          <button
            type="button"
            className="datetime-picker-btn"
            onClick={() => openPicker(dateRef.current)}
            aria-label={`Open calendar for ${label}`}
            title="Pick date"
          >
            <Calendar className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="datetime-field-time-wrap">
          <input
            id={`${fieldId}-time`}
            ref={timeRef}
            type="time"
            className="input datetime-field-part"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            aria-label={`${label} time`}
          />
          <button
            type="button"
            className="datetime-picker-btn"
            onClick={() => openPicker(timeRef.current)}
            aria-label={`Open time picker for ${label}`}
            title="Pick time"
          >
            <Clock className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
