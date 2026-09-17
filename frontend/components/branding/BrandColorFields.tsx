"use client";

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
    </section>
  );
}
