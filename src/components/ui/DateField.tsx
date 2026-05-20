"use client";

import { useRef } from "react";
import { Calendar } from "lucide-react";

interface DateFieldProps {
  id?: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
}

function openPicker(input: HTMLInputElement | null) {
  if (!input) return;
  input.focus();
  if (typeof input.showPicker === "function") {
    try {
      input.showPicker();
    } catch {
      /* ignore */
    }
  }
}

export function DateField({
  id,
  label,
  hint,
  value,
  onChange,
  optional,
}: DateFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const dateRef = useRef<HTMLInputElement>(null);

  return (
    <div className="datetime-field">
      <label className="label" htmlFor={fieldId}>
        {label}
        {optional && <span className="field-optional">Optional</span>}
      </label>
      {hint && <p className="field-hint">{hint}</p>}
      <div className="datetime-field-date-wrap">
        <input
          id={fieldId}
          ref={dateRef}
          type="date"
          className="input datetime-field-part"
          value={value}
          onChange={(e) => onChange(e.target.value)}
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
    </div>
  );
}
