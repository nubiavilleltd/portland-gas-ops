"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCompanyBranding } from "@/lib/company-branding";
import { claimWorkspaceSetup } from "@/lib/workspace-branding-api";
import { useRouter } from "next/navigation";

export default function WorkspacePendingPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const { name, setWorkspaceLifecycle } = useCompanyBranding();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  async function handleClaim(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsClaiming(true);
    try {
      const workspace = await claimWorkspaceSetup(code);
      setWorkspaceLifecycle(workspace.status, workspace.can_complete_onboarding);
      router.replace("/onboarding");
    } catch (claimError: unknown) {
      const response = claimError as { response?: { data?: { detail?: string } } };
      setError(response.response?.data?.detail ?? "We could not verify that setup code.");
    } finally {
      setIsClaiming(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-bg px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-brand-border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-purple/10 text-brand-purple">
          <Building2 size={28} />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-purple">Workspace setup</p>
        <h1 className="mt-2 text-2xl font-semibold text-brand-text-primary">{name === "Your Company" ? "Your workspace" : name} is being prepared</h1>
        <p className="mt-3 text-sm leading-6 text-brand-text-secondary">
          Enter the setup code provided to your workspace administrator. The account email and code must both match the workspace invitation.
        </p>
        <form onSubmit={handleClaim} className="mt-6 text-left" noValidate>
          <label htmlFor="workspace-setup-code" className="mb-2 block text-sm font-medium text-brand-text-primary">Workspace setup code</label>
          <input
            id="workspace-setup-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Enter setup code"
            autoComplete="one-time-code"
            spellCheck={false}
            className="h-11 w-full rounded-lg border border-brand-border bg-white px-3 font-mono text-sm uppercase text-brand-text-primary outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20"
          />
          {error && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={isClaiming || !code.trim()}
            className="mt-4 w-full rounded-lg bg-brand-purple px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-purple-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isClaiming ? "Verifying…" : "Continue to workspace setup"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-6 rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-brand-text-secondary transition hover:bg-gray-50"
        >
          Sign out
        </button>
      </section>
    </main>
  );
}
