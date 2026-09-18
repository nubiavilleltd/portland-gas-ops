"use client";

import { AlertTriangle, CheckCircle2, WandSparkles } from "lucide-react";
import { getBrandColorSuggestions, getColorPairRatio } from "@/lib/branding-quality";

interface BrandColorFieldsProps {
  primaryColor: string;
  secondaryColor: string;
  onPrimaryChange: (value: string) => void;
  onSecondaryChange: (value: string) => void;
}

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-brand-text-primary">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#7234BD"}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="h-11 w-12 cursor-pointer rounded-lg border border-brand-border bg-white p-1"
          aria-label={`${label} color picker`}
        />
        <input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="#7234BD"
          maxLength={7}
          spellCheck={false}
          className="h-11 min-w-0 flex-1 rounded-lg border border-brand-border bg-white px-3 font-mono text-sm uppercase text-brand-text-primary outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
        />
      </div>
    </div>
  );
}

export default function BrandColorFields({
  primaryColor,
  secondaryColor,
  onPrimaryChange,
  onSecondaryChange,
}: BrandColorFieldsProps) {
  const ratio = getColorPairRatio(primaryColor, secondaryColor);
  const suggestions = /^#[0-9a-f]{6}$/i.test(primaryColor) && /^#[0-9a-f]{6}$/i.test(secondaryColor)
    ? getBrandColorSuggestions(primaryColor, secondaryColor)
    : [];

  return (
    <section>
      <h3 className="text-sm font-semibold text-brand-text-primary">App colors</h3>
      <p className="mt-1 text-xs leading-5 text-brand-text-secondary">
        Primary color controls actions, links, and highlights. Secondary color controls navigation and dark brand surfaces.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ColorField id="settings-primary-color" label="Primary color" value={primaryColor} onChange={onPrimaryChange} />
        <ColorField id="settings-secondary-color" label="Secondary color" value={secondaryColor} onChange={onSecondaryChange} />
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-brand-border bg-gray-50 p-3">
        <span className="h-8 w-8 rounded-lg shadow-sm" style={{ backgroundColor: primaryColor }} aria-hidden="true" />
        <span className="h-8 w-8 rounded-lg shadow-sm" style={{ backgroundColor: secondaryColor }} aria-hidden="true" />
        <span className="ml-1 text-xs text-brand-text-secondary">Preview across the workspace</span>
      </div>
      {ratio !== null && ratio < 2.5 ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <p>
              These colors are close in contrast ({ratio.toFixed(2)}:1), so navigation and action surfaces may be hard to distinguish.
            </p>
          </div>
        </div>
      ) : ratio !== null ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
          <p>These colors have a useful visual separation ({ratio.toFixed(2)}:1). Preview them before saving.</p>
        </div>
      ) : null}
      {suggestions.length > 0 && (
        <div className="mt-4 rounded-xl border border-brand-purple/20 bg-brand-purple/5 p-3">
          <div className="flex items-start gap-2">
            <WandSparkles size={15} className="mt-0.5 shrink-0 text-brand-purple" />
            <div>
              <p className="text-xs font-semibold text-brand-text-primary">Suggestions to compare</p>
              <p className="mt-1 text-xs leading-5 text-brand-text-secondary">
                These are contrast-based alternatives. They do not replace your brand colors automatically.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={`${suggestion.label}-${suggestion.secondary}`}
                    type="button"
                    onClick={() => {
                      onPrimaryChange(suggestion.primary);
                      onSecondaryChange(suggestion.secondary);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-2.5 py-2 text-left text-xs font-medium text-brand-text-primary ring-1 ring-inset ring-brand-border transition hover:ring-brand-purple"
                    title={suggestion.reason}
                  >
                    <span className="flex gap-1" aria-hidden="true">
                      <span className="h-4 w-4 rounded" style={{ backgroundColor: suggestion.primary }} />
                      <span className="h-4 w-4 rounded" style={{ backgroundColor: suggestion.secondary }} />
                    </span>
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
