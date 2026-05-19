"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { cn, toTitleCase } from "@/lib/utils";

interface Props
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "size" | "onChange" | "value" | "defaultValue"
  > {
  label: string;
  value: string[];
  suggestions?: string[];
  placeholder?: string;
  error?: string;
  hint?: string;
  onValueChange?: (value: string[]) => void;
}

function setNativeInputValue(input: HTMLInputElement, nextValue: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )?.set;

  valueSetter?.call(input, nextValue);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

const FormTagInput = forwardRef<HTMLInputElement, Props>(
  (
    {
      label,
      value,
      suggestions = [],
      placeholder = "Type and add",
      error,
      hint,
      className,
      id,
      onValueChange,
      disabled,
      required,
      name,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    const hiddenInputRef = useRef<HTMLInputElement | null>(null);
    const [draft, setDraft] = useState("");
    const normalizedValue = value.map((item) => item.trim()).filter(Boolean);
    const availableSuggestions = suggestions.filter(
      (suggestion) =>
        !normalizedValue.some(
          (item) => item.toLowerCase() === suggestion.toLowerCase()
        )
    );

    useEffect(() => {
      if (hiddenInputRef.current) {
        hiddenInputRef.current.value = normalizedValue.join(", ");
      }
    }, [normalizedValue]);

    function setRefs(node: HTMLInputElement | null) {
      hiddenInputRef.current = node;

      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }

    function updateValue(nextValue: string[]) {
      if (hiddenInputRef.current) {
        setNativeInputValue(hiddenInputRef.current, nextValue.join(", "));
      }

      onValueChange?.(nextValue);
    }

    function addTag(nextTag = draft) {
      const trimmedTag = nextTag.trim();
      if (!trimmedTag) return;

      const exists = normalizedValue.some(
        (item) => item.toLowerCase() === trimmedTag.toLowerCase()
      );

      if (!exists) {
        updateValue([...normalizedValue, trimmedTag]);
      }

      setDraft("");
    }

    function removeTag(tag: string) {
      updateValue(normalizedValue.filter((item) => item !== tag));
    }

    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <label htmlFor={inputId} className="text-sm font-medium text-brand-text-primary">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>

        <input
          {...props}
          ref={setRefs}
          id={`${inputId}-value`}
          name={name}
          type="hidden"
          value={normalizedValue.join(", ")}
          disabled={disabled}
          readOnly
        />

        <div
          className={cn(
            "rounded-lg border border-brand-border bg-white p-2 transition-shadow focus-within:border-emerald-700 focus-within:ring-2 focus-within:ring-emerald-700/15",
            error && "border-red-400 focus-within:ring-red-400/20",
            disabled && "bg-gray-50 opacity-70"
          )}
        >
          {normalizedValue.length > 0 ? (
            <div className="mb-2 flex flex-wrap gap-2">
              {normalizedValue.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100"
                >
                  {toTitleCase(tag)}
                  {!disabled ? (
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="rounded text-emerald-700 hover:text-red-600"
                      aria-label={`Remove ${tag}`}
                    >
                      <X size={12} />
                    </button>
                  ) : null}
                </span>
              ))}
            </div>
          ) : null}

          <div className="flex gap-2">
            <input
              id={inputId}
              value={draft}
              disabled={disabled}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addTag();
                }
              }}
              list={`${inputId}-suggestions`}
              placeholder={placeholder}
              className="h-9 min-w-0 flex-1 rounded-md border border-transparent bg-gray-50 px-3 text-sm text-brand-text-primary outline-none placeholder:text-brand-text-secondary focus:border-emerald-700 focus:bg-white"
            />
            <button
              type="button"
              disabled={disabled || !draft.trim()}
              onClick={() => addTag()}
              className="inline-flex h-9 items-center gap-1 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
            >
              <Plus size={14} />
              Add
            </button>
          </div>

          {availableSuggestions.length > 0 ? (
            <datalist id={`${inputId}-suggestions`}>
              {availableSuggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          ) : null}
        </div>

        {hint && !error && <p className="text-xs text-brand-text-secondary">{hint}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);

FormTagInput.displayName = "FormTagInput";

export default FormTagInput;
