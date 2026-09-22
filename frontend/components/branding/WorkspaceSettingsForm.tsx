"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Check, ImagePlus, X } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import {
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
  normalizeHexColor,
  useCompanyBranding,
  type LogoBackground,
} from "@/lib/company-branding";
import BrandColorFields from "@/components/branding/BrandColorFields";
import BrandingPreview from "@/components/branding/BrandingPreview";
import LogoBackgroundPicker from "@/components/branding/LogoBackgroundPicker";
import LogoEditor from "@/components/branding/LogoEditor";
import { getLogoWarnings, inspectLogoFile, type LogoInspection } from "@/lib/branding-quality";
import {
  dataUrlToLogoFile,
  toCompanyBranding,
  updateWorkspaceBranding,
  uploadWorkspaceLogo,
} from "@/lib/workspace-branding-api";
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
  const { name, logoDataUrl, logoBackground: storedLogoBackground, primaryColor, secondaryColor, setBranding } = useCompanyBranding();
  const {
    enabledFeatures,
    enabledAutomations,
    setPreferences,
  } = useWorkspacePreferences();
  const [companyName, setCompanyName] = useState(name);
  const [companyLogo, setCompanyLogo] = useState<string | null>(logoDataUrl);
  const [appLogoBackground, setAppLogoBackground] = useState<LogoBackground>(storedLogoBackground);
  const [appPrimaryColor, setAppPrimaryColor] = useState(primaryColor);
  const [appSecondaryColor, setAppSecondaryColor] = useState(secondaryColor);
  const [logoFileName, setLogoFileName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoInspection, setLogoInspection] = useState<LogoInspection | null>(null);
  const [showLogoEditor, setShowLogoEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
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
      setLogoFile(file);
      void inspectLogoFile(file).then(setLogoInspection).catch(() => setLogoInspection(null));
    };
    reader.onerror = () => setError("We could not read that logo. Please try again.");
    reader.readAsDataURL(file);
  }

  function clearLogo() {
    setCompanyLogo(null);
    setLogoFileName("");
    setLogoFile(null);
    setLogoInspection(null);
    setShowLogoEditor(false);
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
    setAppLogoBackground(storedLogoBackground);
    setAppPrimaryColor(primaryColor);
    setAppSecondaryColor(secondaryColor);
    setLogoFileName("");
    setLogoFile(null);
    setSelectedFeatures(enabledFeatures.length ? enabledFeatures : DEFAULT_ENABLED_FEATURES);
    setSelectedAutomations(enabledAutomations);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
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

    const localBranding = {
      name: trimmedName,
      logoDataUrl: companyLogo,
      primaryColor: normalizeHexColor(appPrimaryColor, DEFAULT_PRIMARY_COLOR),
      secondaryColor: normalizeHexColor(appSecondaryColor, DEFAULT_SECONDARY_COLOR),
    };

    setError(null);
    setIsSaving(true);
    try {
      let logoUrl = companyLogo.startsWith("https://") ? companyLogo : undefined;
      const fileToUpload = logoFile ?? (
        companyLogo.startsWith("data:")
          ? await dataUrlToLogoFile(companyLogo)
          : null
      );
      if (fileToUpload) {
        logoUrl = (await uploadWorkspaceLogo(fileToUpload)).logo_url;
      }

      const workspace = await updateWorkspaceBranding({
        name: localBranding.name,
        logoBackground: appLogoBackground,
        primaryColor: localBranding.primaryColor,
        secondaryColor: localBranding.secondaryColor,
        logoUrl,
      });
      setBranding(toCompanyBranding(workspace));
      setCompanyLogo(workspace.logo_url);
      setLogoFile(null);
      setLogoFileName("");
      setLogoInspection(null);
      setPreferences({
        enabledFeatures: selectedFeatures,
        enabledAutomations: selectedAutomations,
      });
      toast.success("Workspace settings saved for everyone.");
    } catch {
      setError("Workspace settings could not be saved. Check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
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
                    <>
                      <button type="button" onClick={() => setShowLogoEditor(true)} className="inline-flex items-center gap-1 text-sm text-brand-purple hover:text-brand-purple-dark">
                        Adjust crop
                      </button>
                      <button type="button" onClick={clearLogo} className="inline-flex items-center gap-1 text-sm text-brand-text-secondary hover:text-red-600">
                        <X size={14} /> Remove
                      </button>
                    </>
                  )}
                </div>
                {logoInspection && getLogoWarnings(logoInspection).length > 0 && (
                  <div className="mt-3 space-y-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    {getLogoWarnings(logoInspection).map((warning) => <p key={warning}>{warning}</p>)}
                  </div>
                )}
                <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => handleLogoChange(event.target.files?.[0])} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <BrandColorFields
        primaryColor={appPrimaryColor}
        secondaryColor={appSecondaryColor}
        onPrimaryChange={setAppPrimaryColor}
        onSecondaryChange={setAppSecondaryColor}
      />
      <LogoBackgroundPicker value={appLogoBackground} onChange={setAppLogoBackground} />
      <button
        type="button"
        onClick={() => setShowPreview((current) => !current)}
        className="w-fit rounded-lg border border-brand-border px-3 py-2 text-sm font-medium text-brand-purple transition hover:border-brand-purple hover:bg-brand-purple/5"
      >
        {showPreview ? "Hide workspace preview" : "Preview workspace branding"}
      </button>
      {showPreview && (
        <BrandingPreview
          companyName={companyName}
          logoUrl={companyLogo}
          logoBackground={appLogoBackground}
          primaryColor={normalizeHexColor(appPrimaryColor, DEFAULT_PRIMARY_COLOR)}
          secondaryColor={normalizeHexColor(appSecondaryColor, DEFAULT_SECONDARY_COLOR)}
        />
      )}

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
        <h3 className="text-sm font-semibold text-brand-text-primary">Notifications and reminders</h3>
        <p className="mt-1 text-xs text-brand-text-secondary">Choose the notifications and reminders your team wants prepared.</p>
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
        <p className="mt-3 text-xs text-brand-text-secondary">Delivery will be connected when the backend notification service is enabled.</p>
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
      {showLogoEditor && companyLogo && (
        <LogoEditor
          src={companyLogo}
          onClose={() => setShowLogoEditor(false)}
          onApply={(file, previewUrl) => {
            setCompanyLogo(previewUrl);
            setLogoFile(file);
            setLogoFileName("Adjusted logo");
            void inspectLogoFile(file).then(setLogoInspection).catch(() => setLogoInspection(null));
            setShowLogoEditor(false);
          }}
        />
      )}
    </form>
  );
}
