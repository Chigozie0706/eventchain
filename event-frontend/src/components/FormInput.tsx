"use client";

import { ReactNode } from "react";

interface FormInputProps {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  hint?: string;
}

export function FormInput({
  label,
  required,
  children,
  className = "",
  hint,
}: FormInputProps) {
  return (
    <div className={`ec-field ${className}`}>
      <style>{`
        .ec-field { display: flex; flex-direction: column; gap: 6px; }

        .ec-field-label {
          font-family: var(--ec-font-body, 'DM Sans', sans-serif);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: rgba(248, 250, 252, 0.45);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .ec-field-required {
          color: #35D07F;
          font-size: 13px;
          line-height: 1;
        }

        .ec-field-hint {
          font-family: var(--ec-font-body, 'DM Sans', sans-serif);
          font-size: 11px;
          color: rgba(248, 250, 252, 0.28);
          line-height: 1.5;
          margin-top: 4px;
        }

        /* ── Shared input styles injected globally so child inputs pick them up ── */
        .ec-field input[type="text"],
        .ec-field input[type="number"],
        .ec-field input[type="date"],
        .ec-field input[type="time"],
        .ec-field textarea,
        .ec-field select {
          width: 100%;
          padding: 11px 14px;
          background: #132035;
          border: 1px solid rgba(53, 208, 127, 0.13);
          border-radius: 12px;
          font-family: var(--ec-font-body, 'DM Sans', sans-serif);
          font-size: 14px;
          font-weight: 400;
          color: #F8FAFC;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
          -webkit-appearance: none;
          appearance: none;
        }

        .ec-field input[type="text"]::placeholder,
        .ec-field input[type="number"]::placeholder,
        .ec-field textarea::placeholder {
          color: rgba(248, 250, 252, 0.22);
        }

        .ec-field input[type="text"]:focus,
        .ec-field input[type="number"]:focus,
        .ec-field input[type="date"]:focus,
        .ec-field input[type="time"]:focus,
        .ec-field textarea:focus,
        .ec-field select:focus {
          border-color: rgba(53, 208, 127, 0.45);
          box-shadow: 0 0 0 3px rgba(53, 208, 127, 0.09);
          background: #192840;
        }

        /* Date/time picker color fix */
        .ec-field input[type="date"]::-webkit-calendar-picker-indicator,
        .ec-field input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(0.6) sepia(1) saturate(3) hue-rotate(100deg);
          cursor: pointer;
        }

        /* Select arrow */
        .ec-field select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(53,208,127,0.6)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 40px;
          cursor: pointer;
        }

        .ec-field select option {
          background: #0C1A2E;
          color: #F8FAFC;
        }

        .ec-field textarea {
          resize: vertical;
          min-height: 110px;
          line-height: 1.65;
        }

        /* Error state */
        .ec-field input.ec-input-error,
        .ec-field select.ec-input-error,
        .ec-field textarea.ec-input-error {
          border-color: rgba(248, 113, 113, 0.45);
          box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.08);
        }

        .ec-field-error {
          font-size: 11px;
          color: #F87171;
          display: flex;
          align-items: center;
          gap: 5px;
        }
      `}</style>

      <label className="ec-field-label">
        {label}
        {required && <span className="ec-field-required">*</span>}
      </label>

      {children}

      {hint && <p className="ec-field-hint">{hint}</p>}
    </div>
  );
}
