"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export type SafetyChoiceOption = {
  value: string;
  label: string;
};

export type SafetyChoiceRow = {
  label: string;
  required?: boolean;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

export default function SafetyChoiceTable({
  rows,
  options,
  disabled = false,
}: {
  rows: SafetyChoiceRow[];
  options: SafetyChoiceOption[];
  disabled?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-brand-border">
      <div
        className="grid border-b border-brand-border bg-gray-50 text-xs font-semibold uppercase tracking-wide text-brand-text-secondary"
        style={{ gridTemplateColumns: `minmax(220px,1fr) repeat(${options.length}, minmax(72px, 96px))` }}
      >
        <div className="px-4 py-3">Check</div>
        {options.map((option) => (
          <div key={option.value} className="px-3 py-3 text-center">
            {option.label}
          </div>
        ))}
      </div>

      <div className="divide-y divide-brand-border">
        {rows.map((row) => (
          <SafetyChoiceTableRow
            key={row.label}
            row={row}
            options={options}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

function SafetyChoiceTableRow({
  row,
  options,
  disabled,
}: {
  row: SafetyChoiceRow;
  options: SafetyChoiceOption[];
  disabled: boolean;
}) {
  const id = useId();
  const isControlled = row.value !== undefined;
  const [internalValue, setInternalValue] = useState(row.defaultValue ?? "");
  const selectedValue = isControlled ? row.value ?? "" : internalValue;

  function handleChange(nextValue: string) {
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    row.onValueChange?.(nextValue);
  }

  return (
    <div
      className="grid bg-white text-sm"
      style={{ gridTemplateColumns: `minmax(220px,1fr) repeat(${options.length}, minmax(72px, 96px))` }}
    >
      <div className="px-4 py-3 font-medium text-brand-text-primary">
        {row.label}
        {row.required ? <span className="ml-1 text-red-500">*</span> : null}
      </div>
      {options.map((option) => {
        const checked = selectedValue === option.value;
        return (
          <label
            key={option.value}
            className={cn(
              "flex items-center justify-center px-3 py-3",
              disabled ? "cursor-not-allowed bg-gray-50" : "cursor-pointer hover:bg-brand-purple-faint",
            )}
          >
            <input
              type="radio"
              name={`${id}-${row.label}`}
              value={option.value}
              checked={checked}
              disabled={disabled}
              onChange={() => handleChange(option.value)}
              className="h-4 w-4 border-brand-border text-brand-purple focus:ring-brand-purple disabled:cursor-not-allowed"
            />
            <span className="sr-only">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}
