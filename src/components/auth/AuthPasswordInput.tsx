"use client";

import { useState } from "react";
import { IonIcon } from "@ionic/react";
import { eyeOffOutline, eyeOutline, lockClosedOutline } from "ionicons/icons";

type AuthPasswordInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
};

export function AuthPasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
}: AuthPasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="auth-input-wrap auth-input-wrap--password">
      <IonIcon icon={lockClosedOutline} className="auth-input-icon" aria-hidden />
      <input
        id={id}
        type={visible ? "text" : "password"}
        className="input auth-input auth-input--password"
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(ev) => onChange(ev.target.value)}
      />
      <button
        type="button"
        className="auth-password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        tabIndex={0}
      >
        <IonIcon icon={visible ? eyeOffOutline : eyeOutline} aria-hidden />
      </button>
    </div>
  );
}
