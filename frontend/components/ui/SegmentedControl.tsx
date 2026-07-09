"use client";

interface Option { value: string; label: string }

interface Props {
  label?: string;
  required?: boolean;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}

/** Compact inline segmented control — fits content width, smooth active state */
export default function SegmentedControl({ label, required, options, value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1.5 w-fit">
      {label && (
        <p className="text-sm font-medium text-brand-text-primary">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </p>
      )}
      <div className="flex rounded-lg border border-brand-border bg-gray-50 p-0.5 gap-0.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
              value === opt.value
                ? "bg-white text-brand-text-primary shadow-sm"
                : "text-brand-text-secondary hover:text-brand-text-primary"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
