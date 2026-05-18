"use client";

/**
 * ToggleGroup — pill-style radio switcher.
 *
 * Usage:
 *   <ToggleGroup
 *     options={[
 *       { label: "Loan", value: "loan", hint: "Asset will be returned." },
 *       { label: "Requisition", value: "requisition", hint: "Permanent assignment." },
 *     ]}
 *     value={type}
 *     onChange={setType}
 *   />
 */

export interface ToggleOption<T extends string = string> {
  label: string;
  value: T;
  /** Optional hint shown below the toggle when this option is active */
  hint?: string;
}

interface Props<T extends string = string> {
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  required?: boolean;
  error?: string;
}

export default function ToggleGroup<T extends string = string>({
  options,
  value,
  onChange,
  label,
  required,
  error,
}: Props<T>) {
  const activeOption = options.find((o) => o.value === value);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-sm font-medium text-brand-text-primary">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
      )}

      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
              value === opt.value
                ? "bg-white text-brand-text-primary shadow-sm"
                : "text-brand-text-secondary hover:text-brand-text-primary",
            ].join(" ")}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {activeOption?.hint && (
        <p className="text-xs text-brand-text-secondary">{activeOption.hint}</p>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
