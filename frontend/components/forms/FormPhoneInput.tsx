"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

// Allowed characters in a phone number field:
//   digits 0–9, + (country code prefix), - (separator), ( ) (grouping), space
// Everything else — including 'e', letters, symbols — is blocked at the keystroke level.
const ALLOWED_KEYS = new Set([
  "Backspace", "Delete", "Tab", "Enter", "Escape",
  "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
  "Home", "End",
]);

function isAllowedPhoneChar(key: string): boolean {
  if (ALLOWED_KEYS.has(key)) return true;
  if (key.length === 1 && /[\d+\-() ]/.test(key)) return true;
  // Allow Ctrl/Cmd combos (copy, paste, select all, etc.)
  return false;
}

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
  hint?: string;
}

/**
 * FormPhoneInput — reusable phone number field.
 *
 * Rules (applied from a single place — here):
 *  - type="text" + inputMode="tel"  → numeric keyboard on mobile, no browser 'e' weirdness
 *  - maxLength 20                   → covers any international format incl. country code + spaces
 *  - Keystroke filter               → only digits, +, -, (, ), space allowed — no letters, no 'e'
 *  - No regex pattern validation    → freedom to enter any country format or omit country code
 *
 * To change validation rules for all phone fields system-wide, edit this file only.
 */
const FormPhoneInput = forwardRef<HTMLInputElement, Props>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      // Allow Ctrl/Cmd key combos (copy, paste, select all, undo, etc.)
      if (e.ctrlKey || e.metaKey) return;
      if (!isAllowedPhoneChar(e.key)) e.preventDefault();
      props.onKeyDown?.(e);
    }

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="text-sm font-medium text-brand-text-primary">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          {...props}
          ref={ref}
          id={inputId}
          type="text"
          inputMode="tel"
          maxLength={props.maxLength ?? 20}
          autoComplete="tel"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          onKeyDown={handleKeyDown}
          className={cn(
            "h-10 w-full rounded-lg border border-brand-border bg-white px-3 text-sm text-brand-text-primary placeholder:text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent transition-shadow",
            props.disabled && "cursor-not-allowed border-gray-200 bg-black opacity-50 shadow-none focus:ring-0 focus:border-gray-200",
            error && "border-red-400 focus:ring-red-400",
            className
          )}
        />
        {hint && !error && <p className="text-xs text-brand-text-secondary">{hint}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
FormPhoneInput.displayName = "FormPhoneInput";
export default FormPhoneInput;
