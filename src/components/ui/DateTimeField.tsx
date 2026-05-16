"use client";

import { CalendarClock } from "lucide-react";

interface DateTimeFieldProps {
  id?: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
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

  return (
    <div className="datetime-field">
      <label className="label" htmlFor={fieldId}>
        {label}
        {optional && <span className="field-optional">Optional</span>}
      </label>
      {hint && <p className="field-hint">{hint}</p>}
      <div className="datetime-field-input-wrap">
        <CalendarClock className="datetime-field-icon" aria-hidden />
        <input
          id={fieldId}
          type="datetime-local"
          className="input datetime-field-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
