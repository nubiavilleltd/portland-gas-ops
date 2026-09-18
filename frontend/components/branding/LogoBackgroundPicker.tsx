"use client";

import type { LogoBackground } from "@/lib/company-branding";

export default function LogoBackgroundPicker({
  value,
  onChange,
}: {
  value: LogoBackground;
  onChange: (value: LogoBackground) => void;
}) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-sm font-medium text-brand-text-primary">Logo background</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {([
          ["light", "Light surface", "bg-white text-slate-900"],
          ["dark", "Dark surface", "bg-slate-900 text-white"],
          ["none", "No background", "bg-transparent text-slate-500 ring-1 ring-inset ring-dashed ring-slate-300"],
        ] as const).map(([id, label, surfaceClass]) => (
          <button
            key={id}
            type="button"
            aria-pressed={value === id}
            onClick={() => onChange(id)}
            className={`flex items-center gap-3 rounded-lg border p-3 text-left transition ${
              value === id ? "border-brand-purple ring-2 ring-brand-purple/20" : "border-brand-border"
            }`}
          >
            <span className={`flex h-9 w-12 items-center justify-center rounded-md text-[10px] font-semibold ${surfaceClass}`}>
              Aa
            </span>
            <span className="text-sm font-medium text-brand-text-primary">{label}</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs leading-5 text-brand-text-secondary">
        Choose a surface behind transparent logos, or select No background to keep the logo transparent. JPG backgrounds are already part of the image.
      </p>
    </div>
  );
}
