"use client";

import { useCompanyBranding } from "@/lib/company-branding";
import { useAuthStore } from "@/store/authStore";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function BrandingGate({ children }: { children: React.ReactNode }) {
  const { hasHydrated, hasResolvedWorkspace } = useCompanyBranding();
  const accessToken = useAuthStore((state) => state.accessToken);

  // Workspace setup is temporarily disabled. We still wait for the current
  // workspace request so server-backed branding is applied before the app is
  // shown, but we do not redirect users through setup or onboarding.
  //
  // This wait is now bounded (see Providers.tsx), but a bounded wait can
  // still take a few seconds against a slow connection, and rendering
  // nothing during that time is indistinguishable from the page having
  // failed outright. A visible spinner turns "is this broken?" into
  // "this is loading" for exactly the same wait.
  if (accessToken && (!hasHydrated || !hasResolvedWorkspace)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  return <>{children}</>;
}
