"use client";

import {
  forwardRef,
  useEffect,
  useState,
} from "react";

import { cn } from "@/lib/utils";

function format(value: string) {
  if (!value) return "";

  const num = Number(value);

  if (isNaN(num)) return "";

  return num.toLocaleString();
}

function strip(value: string) {
  return value.replace(/,/g, "");
}

interface CurrencyInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange"
  > {
  label?: string;
  error?: string;
  hint?: string;

  value: string | number;

  onValueChange: (value: string) => void;

  inputClassName?: string;
}

const CurrencyInput = forwardRef<
  HTMLInputElement,
  CurrencyInputProps
>(
  (
    {
      label,
      error,
      hint,
      value,
      onValueChange,
      className,
      inputClassName,
      required,
      disabled,
      id,
      placeholder = "Enter amount",
      ...props
    },
    ref
  ) => {
    const [display, setDisplay] = useState("");

    const inputId =
      id ??
      (label
        ? label.toLowerCase().replace(/\s+/g, "-")
        : "currency-input");

    useEffect(() => {
      if (value !== undefined && value !== null) {
        setDisplay(format(String(value)));
      }
    }, [value]);

    return (
      <div
        className={cn(
          "flex w-full flex-col gap-1 self-start",
          className
        )}
      >
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-brand-text-primary"
          >
            {label}

            {required && (
              <span className="ml-1 text-red-500">
                *
              </span>
            )}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={display}
          onChange={(e) => {
            const raw = strip(e.target.value);

            // prevent invalid numeric values
            if (!/^\d*\.?\d*$/.test(raw)) return;

            setDisplay(format(raw));

            onValueChange(raw);
          }}
          className={cn(
            "h-10 w-full rounded-lg border border-brand-border bg-white px-3 text-sm text-brand-text-primary transition-shadow",
            "focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-purple",
            "placeholder:text-brand-text-secondary",
            error &&
              "border-red-400 focus:ring-red-400",
            disabled &&
              "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400 focus:border-gray-200 focus:ring-0",
            inputClassName
          )}
          {...props}
        />

        {hint && !error && (
          <p className="text-xs text-brand-text-secondary">
            {hint}
          </p>
        )}

        {error && (
          <p className="text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export default CurrencyInput;