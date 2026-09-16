"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Check, ImagePlus, X } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useCompanyBranding } from "@/lib/company-branding";
import {
  DEFAULT_ENABLED_FEATURES,
  WORKSPACE_AUTOMATIONS,
  WORKSPACE_FEATURES,
  useWorkspacePreferences,
  type AutomationId,
  type FeatureId,
} from "@/lib/workspace-preferences";

const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function OptionCard({
  label,
  description,
  Icon,
  selected,
  onClick,
}: {
  label: string;
  description: string;
  Icon: React.ElementType;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
        selected
          ? "border-brand-purple bg-brand-purple/5 ring-1 ring-brand-purple/20"
          : "border-brand-border bg-white hover:border-brand-purple/40 hover:bg-gray-50"
      }`}
    >
      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${selected ? "bg-brand-purple text-white" : "bg-gray-100 text-brand-text-secondary"}`}>
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="text-sm font-semibold text-brand-text-primary">{label}</span>
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-brand-purple bg-brand-purple text-white" : "border-brand-border text-transparent"}`}>
            <Check size={12} />
          </span>
        </span>
        <span className="mt-1 block text-xs leading-5 text-brand-text-secondary">{description}</span>
      </span>
    </button>
  );
}

export default function WorkspaceSettingsForm() {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const { name, logoDataUrl, setBranding } = useCompanyBranding();
  const {
    enabledFeatures,
    enabledAutomations,
    setPreferences,
  } = useWorkspacePreferences();
  const [companyName, setCompanyName] = useState(name);
  const [companyLogo, setCompanyLogo] = useState<string | null>(logoDataUrl);
  const [logoFileName, setLogoFileName] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState<FeatureId[]>(
    enabledFeatures.length ? enabledFeatures : DEFAULT_ENABLED_FEATURES,
  );
  const [selectedAutomations, setSelectedAutomations] = useState<AutomationId[]>(enabledAutomations);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function handleLogoChange(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!ACCEPTED_TYPES.has(file.type)) {
      setError("Upload a PNG, JPG, or WEBP logo.");
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      setError("Your logo must be smaller than 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCompanyLogo(String(reader.result));
      setLogoFileName(file.name);
    };
    reader.onerror = () => setError("We could not read that logo. Please try again.");
    reader.readAsDataURL(file);
  }

  function clearLogo() {
    setCompanyLogo(null);
    setLogoFileName("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function toggleFeature(id: FeatureId) {
    setSelectedFeatures((current) =>
      current.includes(id) ? current.filter((featureId) => featureId !== id) : [...current, id],
    );
    setError(null);
  }

  function toggleAutomation(id: AutomationId) {
    setSelectedAutomations((current) =>
      current.includes(id)
        ? current.filter((automationId) => automationId !== id)
        : [...current, id],
    );
  }

  function resetForm() {
    setCompanyName(name);
    setCompanyLogo(logoDataUrl);
    setLogoFileName("");
    setSelectedFeatures(enabledFeatures.length ? enabledFeatures : DEFAULT_ENABLED_FEATURES);
    setSelectedAutomations(enabledAutomations);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = companyName.trim();
    if (!trimmedName) {
      setError("Enter your company name.");
      return;
    }
    if (!companyLogo) {
      setError("Add a company logo to continue.");
      return;
    }
    if (selectedFeatures.length === 0) {
      setError("Choose at least one feature for your workspace.");
      return;
    }

    setIsSaving(true);
    setBranding({ name: trimmedName, logoDataUrl: companyLogo });
    setPreferences({
      enabledFeatures: selectedFeatures,
      enabledAutomations: selectedAutomations,
    });
    setError(null);
    setIsSaving(false);
    toast.success("Workspace settings saved.");
  }

  return (
    <form onSubmit={saveSettings} className="space-y-7 border-t border-brand-border pt-5" noValidate>
      <section>
        <h3 className="text-sm font-semibold text-brand-text-primary">Company identity</h3>
        <p className="mt-1 text-xs text-brand-text-secondary">Update the name and logo shown across the workspace and generated documents.</p>
        <div className="mt-4 grid gap-4">
          <div>
            <label htmlFor="settings-company-name" className="mb-2 block text-sm font-medium text-brand-text-primary">Company name</label>
            <input
              id="settings-company-name"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              autoComplete="organization"
              className="h-11 w-full rounded-lg border border-brand-border bg-white px-3 text-sm text-brand-text-primary outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
            />
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-brand-text-primary">Company logo</span>
            <div className="flex flex-col gap-4 rounded-xl border border-dashed border-brand-border bg-gray-50 p-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-brand-border bg-white p-3">
                {companyLogo ? (
                  <Image
                    src={companyLogo}
                    alt="Company logo preview"
                    width={64}
                    height={64}
                    unoptimized
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <ImagePlus size={26} className="text-brand-text-secondary" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-brand-text-primary">{logoFileName || "Current company logo"}</p>
                <p className="mt-1 text-xs text-brand-text-secondary">PNG, JPG, or WEBP. Maximum file size: 2 MB.</p>
                <div className="mt-3 flex items-center gap-3">
                  <button type="button" onClick={() => inputRef.current?.click()} className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-brand-purple shadow-sm ring-1 ring-inset ring-brand-border transition hover:bg-brand-purple/5">
                    Replace logo
                  </button>
                  {companyLogo && (
                    <button type="button" onClick={clearLogo} className="inline-flex items-center gap-1 text-sm text-brand-text-secondary hover:text-red-600">
                      <X size={14} /> Remove
                    </button>
                  )}
                </div>
                <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => handleLogoChange(event.target.files?.[0])} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-brand-text-primary">Workspace features</h3>
        <p className="mt-1 text-xs text-brand-text-secondary">Choose which module areas appear on the user home page.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {WORKSPACE_FEATURES.map((feature) => (
            <OptionCard
              key={feature.id}
              label={feature.label}
              description={feature.description}
              Icon={feature.icon}
              selected={selectedFeatures.includes(feature.id)}
              onClick={() => toggleFeature(feature.id)}
            />
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-brand-text-primary">Automations</h3>
        <p className="mt-1 text-xs text-brand-text-secondary">Choose the reminders and notifications your team wants prepared.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {WORKSPACE_AUTOMATIONS.map((automation) => (
            <OptionCard
              key={automation.id}
              label={automation.label}
              description={automation.description}
              Icon={automation.icon}
              selected={selectedAutomations.includes(automation.id)}
              onClick={() => toggleAutomation(automation.id)}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-brand-text-secondary">Automation execution will be connected when the backend automation service is enabled.</p>
      </section>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex items-center gap-3 border-t border-brand-border pt-5">
        <button type="submit" disabled={isSaving} className="h-10 rounded-lg bg-brand-purple px-5 text-sm font-medium text-white transition hover:bg-brand-purple-dark disabled:cursor-not-allowed disabled:opacity-60">
          {isSaving ? "Saving…" : "Save workspace settings"}
        </button>
        <button type="button" onClick={resetForm} disabled={isSaving} className="h-10 rounded-lg px-4 text-sm font-medium text-brand-text-secondary transition hover:bg-gray-50 disabled:opacity-60">
          Cancel
        </button>
      </div>
    </form>
  );
}
