"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface ToggleOption {
  value: string;
  label: string;
}

interface Props
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "size" | "onChange" | "value" | "defaultValue"
  > {
  label: string;
  options: ToggleOption[];
  value?: string;
  defaultValue?: string;
  error?: string;
  hint?: string;
  onValueChange?: (value: string) => void;
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

const FormToggleGroup = forwardRef<HTMLInputElement, Props>(
  (
    {
      label,
      options,
      value,
      defaultValue,
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
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState(defaultValue ?? "");
    const selectedValue = isControlled ? value ?? "" : internalValue;

    useEffect(() => {
      if (hiddenInputRef.current) {
        hiddenInputRef.current.value = selectedValue;
      }
    }, [selectedValue]);

    function setRefs(node: HTMLInputElement | null) {
      hiddenInputRef.current = node;

      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }

    function handleSelect(nextValue: string) {
      if (!isControlled) {
        setInternalValue(nextValue);
      }

      if (hiddenInputRef.current) {
        setNativeInputValue(hiddenInputRef.current, nextValue);
      }

      onValueChange?.(nextValue);
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
          value={selectedValue}
          disabled={disabled}
          readOnly
        />

        <div
          id={inputId}
          className={cn(
            "grid gap-2 rounded-xl border border-brand-border bg-white p-1 sm:grid-flow-col sm:auto-cols-fr",
            disabled && "border-gray-200 bg-gray-100",
            error && "border-red-400"
          )}
        >
          {options.map((option) => {
            const isSelected = selectedValue === option.value;

            return (
              <button
                key={option.value}
                type="button"
                disabled={disabled}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isSelected
                    ? "bg-brand-purple text-white"
                    : "text-brand-text-secondary hover:bg-gray-50 hover:text-brand-text-primary",
                  disabled &&
                    "cursor-not-allowed text-brand-text-primary hover:bg-transparent hover:text-brand-text-primary",
                  disabled && isSelected && "bg-gray-300 text-brand-text-primary"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {hint && !error && <p className="text-xs text-brand-text-secondary">{hint}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);

FormToggleGroup.displayName = "FormToggleGroup";

export default FormToggleGroup;
