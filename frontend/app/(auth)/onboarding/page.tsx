"use client";

import { useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Check, ImagePlus, X } from "lucide-react";
import { useCompanyBranding } from "@/lib/company-branding";
import CompanyLogo from "@/components/branding/CompanyLogo";

const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function OnboardingContent() {
  const router = useRouter();
  const params = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const { name: storedName, logoDataUrl: storedLogo, setBranding } = useCompanyBranding();
  const [name, setName] = useState(storedName === "Your Company" ? "" : storedName);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(storedLogo);
  const [logoName, setLogoName] = useState("");
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
    };
    reader.onerror = () => setError("We could not read that logo. Please try again.");
    reader.readAsDataURL(file);
  }

  function clearLogo() {
    setLogoDataUrl(null);
    setLogoName("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Enter your company name.");
      return;
    }
    if (!logoDataUrl) {
      setError("Add your company logo to continue.");
      return;
    }

    setIsSaving(true);
    setBranding({ name: trimmedName, logoDataUrl });
    const next = params.get("next");
    router.replace(next?.startsWith("/") ? next : "/home");
  }

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-10 sm:flex sm:items-center sm:justify-center">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-purple text-white shadow-sm">
            <Building2 size={28} />
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-purple">
            Workspace setup
          </p>
          <h1 className="text-2xl font-semibold text-brand-text-primary sm:text-3xl">
            Tell us about your company
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-brand-text-secondary">
            Add the name and logo your team should see across the operations platform.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 rounded-2xl border border-brand-border bg-white p-6 shadow-sm sm:p-8" noValidate>
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
                    <button type="button" onClick={clearLogo} className="inline-flex items-center gap-1 text-sm text-brand-text-secondary hover:text-red-600">
                      <X size={14} /> Remove
                    </button>
                  )}
                </div>
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

          {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div className="flex flex-col-reverse gap-3 border-t border-brand-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-brand-text-secondary">
              <CompanyLogo size={22} className="rounded-md" />
              <span>Your branding will be used across the workspace.</span>
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-purple px-5 text-sm font-medium text-white transition hover:bg-brand-purple-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Check size={16} />
              {isSaving ? "Saving…" : "Continue"}
            </button>
          </div>
        </form>
      </div>
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
