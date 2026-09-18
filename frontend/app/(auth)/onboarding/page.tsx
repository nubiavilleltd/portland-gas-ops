"use client";

import { useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ImagePlus,
  X,
} from "lucide-react";
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
  DEFAULT_ENABLED_AUTOMATIONS,
  DEFAULT_ENABLED_FEATURES,
  WORKSPACE_AUTOMATIONS,
  WORKSPACE_FEATURES,
  useWorkspacePreferences,
  type AutomationId,
  type FeatureId,
} from "@/lib/workspace-preferences";

const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const STEPS = ["Company details", "Choose features", "Notifications and reminders"];

type OnboardingStep = 1 | 2 | 3;

function OnboardingContent() {
  const router = useRouter();
  const params = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    name: storedName,
    logoDataUrl: storedLogo,
    logoBackground: storedLogoBackground,
    primaryColor: storedPrimaryColor,
    secondaryColor: storedSecondaryColor,
    setBranding,
  } = useCompanyBranding();
  const {
    enabledFeatures: storedFeatures,
    enabledAutomations: storedAutomations,
    setPreferences,
  } = useWorkspacePreferences();
  const [step, setStep] = useState<OnboardingStep>(1);
  const [name, setName] = useState(storedName === "Your Company" ? "" : storedName);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(storedLogo);
  const [logoBackground, setLogoBackground] = useState<LogoBackground>(storedLogoBackground);
  const [primaryColor, setPrimaryColor] = useState(storedPrimaryColor);
  const [secondaryColor, setSecondaryColor] = useState(storedSecondaryColor);
  const [logoName, setLogoName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoInspection, setLogoInspection] = useState<LogoInspection | null>(null);
  const [showLogoEditor, setShowLogoEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<FeatureId[]>(
    storedFeatures.length ? storedFeatures : DEFAULT_ENABLED_FEATURES,
  );
  const [selectedAutomations, setSelectedAutomations] = useState<AutomationId[]>(
    storedAutomations.length ? storedAutomations : DEFAULT_ENABLED_AUTOMATIONS,
  );
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
      setLogoDataUrl(String(reader.result));
      setLogoName(file.name);
      setLogoFile(file);
      void inspectLogoFile(file).then(setLogoInspection).catch(() => setLogoInspection(null));
    };
    reader.onerror = () => setError("We could not read that logo. Please try again.");
    reader.readAsDataURL(file);
  }

  function clearLogo() {
    setLogoDataUrl(null);
    setLogoName("");
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

  function continueToNextStep() {
    setError(null);
    if (step === 1) {
      if (!name.trim()) {
        setError("Enter your company name.");
        return;
      }
      if (!logoDataUrl) {
        setError("Add your company logo to continue.");
        return;
      }
    }

    if (step === 2 && selectedFeatures.length === 0) {
      setError("Choose at least one feature for your workspace.");
      return;
    }

    setStep((current) => (current + 1) as OnboardingStep);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step !== 3) {
      continueToNextStep();
      return;
    }

    if (!name.trim() || !logoDataUrl || selectedFeatures.length === 0) {
      setStep(!name.trim() || !logoDataUrl ? 1 : 2);
      setError("Complete your company details and choose at least one feature.");
      return;
    }

    const localBranding = {
      name: name.trim(),
      logoDataUrl,
      primaryColor: normalizeHexColor(primaryColor, DEFAULT_PRIMARY_COLOR),
      secondaryColor: normalizeHexColor(secondaryColor, DEFAULT_SECONDARY_COLOR),
    };

    setIsSaving(true);

    try {
      let logoUrl = logoDataUrl.startsWith("https://") ? logoDataUrl : undefined;
      const fileToUpload = logoFile ?? (
        logoDataUrl.startsWith("data:")
          ? await dataUrlToLogoFile(logoDataUrl)
          : null
      );
      if (fileToUpload) {
        logoUrl = (await uploadWorkspaceLogo(fileToUpload)).logo_url;
      }

      const workspace = await updateWorkspaceBranding({
        name: localBranding.name,
        logoBackground,
        primaryColor: localBranding.primaryColor,
        secondaryColor: localBranding.secondaryColor,
        logoUrl,
      });
      setBranding(toCompanyBranding(workspace));
      setPreferences({
        enabledFeatures: selectedFeatures,
        enabledAutomations: selectedAutomations,
      });
    } catch {
      setError("Workspace setup could not be saved. Check your connection and try again.");
      return;
    } finally {
      setIsSaving(false);
    }

    const next = params.get("next");
    router.replace(next?.startsWith("/") ? next : "/home");
  }

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-10 sm:flex sm:items-center sm:justify-center">
      <div className="w-full max-w-3xl">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-purple text-white shadow-sm">
            <Building2 size={28} />
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-purple">
            Workspace setup
          </p>
          <h1 className="text-2xl font-semibold text-brand-text-primary sm:text-3xl">
            Set up your workspace
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-brand-text-secondary">
            Add your company details, then choose the features, notifications, and reminders your team needs.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-2" aria-label="Onboarding progress">
          {STEPS.map((label, index) => {
            const stepNumber = index + 1;
            const isCurrent = stepNumber === step;
            const isComplete = stepNumber < step;
            return (
              <div key={label} className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    isCurrent || isComplete
                      ? "bg-brand-purple text-white"
                      : "bg-white text-brand-text-secondary ring-1 ring-inset ring-brand-border"
                  }`}
                >
                  {isComplete ? <Check size={14} /> : stepNumber}
                </span>
                <span className={`hidden text-xs font-medium sm:block ${isCurrent ? "text-brand-text-primary" : "text-brand-text-secondary"}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm sm:p-8" noValidate>
          {step === 1 && (
            <div className="grid gap-6">
              <div>
                <h2 className="text-lg font-semibold text-brand-text-primary">Company details</h2>
                <p className="mt-1 text-sm text-brand-text-secondary">This is how your workspace will be identified.</p>
              </div>

              <div>
                <label htmlFor="company-name" className="mb-2 block text-sm font-medium text-brand-text-primary">
                  Company name <span className="text-red-500">*</span>
                </label>
                <input
                  id="company-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Acme Energy"
                  autoComplete="organization"
                  className="h-11 w-full rounded-lg border border-brand-border bg-white px-3 text-sm text-brand-text-primary outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-brand-text-primary">
                  Company logo <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col gap-4 rounded-xl border border-dashed border-brand-border bg-gray-50 p-4 sm:flex-row sm:items-center">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-brand-border bg-white p-3">
                    {logoDataUrl ? (
                      <img src={logoDataUrl} alt="Company logo preview" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <ImagePlus size={28} className="text-brand-text-secondary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-brand-text-primary">
                      {logoName || (logoDataUrl ? "Current company logo" : "Upload a logo")}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-brand-text-secondary">
                      PNG, JPG, or WEBP. Maximum file size: 2 MB.
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-brand-purple shadow-sm ring-1 ring-inset ring-brand-border transition hover:bg-brand-purple/5"
                      >
                        {logoDataUrl ? "Replace logo" : "Choose logo"}
                      </button>
                      {logoDataUrl && (
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
                    <input
                      ref={inputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(event) => handleLogoChange(event.target.files?.[0])}
                    />
                  </div>
                </div>
              </div>

              <BrandColorFields
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                onPrimaryChange={setPrimaryColor}
                onSecondaryChange={setSecondaryColor}
              />
              <LogoBackgroundPicker value={logoBackground} onChange={setLogoBackground} />
              <button
                type="button"
                onClick={() => setShowPreview((current) => !current)}
                className="w-fit rounded-lg border border-brand-border px-3 py-2 text-sm font-medium text-brand-purple transition hover:border-brand-purple hover:bg-brand-purple/5"
              >
                {showPreview ? "Hide workspace preview" : "Preview workspace branding"}
              </button>
              {showPreview && (
                <BrandingPreview
                  companyName={name}
                  logoUrl={logoDataUrl}
                  logoBackground={logoBackground}
                  primaryColor={normalizeHexColor(primaryColor, DEFAULT_PRIMARY_COLOR)}
                  secondaryColor={normalizeHexColor(secondaryColor, DEFAULT_SECONDARY_COLOR)}
                />
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-brand-text-primary">Which features do you need?</h2>
                <p className="mt-1 text-sm text-brand-text-secondary">Select the areas your team will use. You can adjust this later as your workspace grows.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {WORKSPACE_FEATURES.map((feature) => {
                  const Icon = feature.icon;
                  const selected = selectedFeatures.includes(feature.id);
                  return (
                    <button
                      key={feature.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleFeature(feature.id)}
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
                          <span className="text-sm font-semibold text-brand-text-primary">{feature.label}</span>
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-brand-purple bg-brand-purple text-white" : "border-brand-border text-transparent"}`}>
                            <Check size={12} />
                          </span>
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-brand-text-secondary">{feature.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-brand-text-primary">Which notifications and reminders should we prepare?</h2>
                <p className="mt-1 text-sm text-brand-text-secondary">Choose the notifications and reminders your team needs. These selections will be ready when the delivery service is connected.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {WORKSPACE_AUTOMATIONS.map((automation) => {
                  const Icon = automation.icon;
                  const selected = selectedAutomations.includes(automation.id);
                  return (
                    <button
                      key={automation.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleAutomation(automation.id)}
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
                          <span className="text-sm font-semibold text-brand-text-primary">{automation.label}</span>
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-brand-purple bg-brand-purple text-white" : "border-brand-border text-transparent"}`}>
                            <Check size={12} />
                          </span>
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-brand-text-secondary">{automation.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-xs text-brand-text-secondary">Notifications and reminders are optional. You can continue without selecting any.</p>
            </div>
          )}

          {error && <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-brand-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep((current) => (current - 1) as OnboardingStep);
              }}
              disabled={step === 1 || isSaving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium text-brand-text-secondary transition hover:bg-gray-50 disabled:invisible"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-purple px-5 text-sm font-medium text-white transition hover:bg-brand-purple-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {step === 3 ? (isSaving ? "Saving…" : "Finish setup") : "Continue"}
              {step === 3 ? <Check size={16} /> : <ArrowRight size={16} />}
            </button>
          </div>
        </form>
      </div>
      {showLogoEditor && logoDataUrl && (
        <LogoEditor
          src={logoDataUrl}
          onClose={() => setShowLogoEditor(false)}
          onApply={(file, previewUrl) => {
            setLogoDataUrl(previewUrl);
            setLogoFile(file);
            setLogoName("Adjusted logo");
            void inspectLogoFile(file).then(setLogoInspection).catch(() => setLogoInspection(null));
            setShowLogoEditor(false);
          }}
        />
      )}
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  );
}
