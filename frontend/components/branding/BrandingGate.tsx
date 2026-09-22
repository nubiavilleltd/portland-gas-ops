"use client";

import { useCompanyBranding } from "@/lib/company-branding";
import { useAuthStore } from "@/store/authStore";

export default function BrandingGate({ children }: { children: React.ReactNode }) {
  const { hasHydrated, hasResolvedWorkspace } = useCompanyBranding();
  const accessToken = useAuthStore((state) => state.accessToken);

  // Workspace setup is temporarily disabled. We still wait for the current
  // workspace request so server-backed branding is applied before the app is
  // shown, but we do not redirect users through setup or onboarding.
  if (accessToken && (!hasHydrated || !hasResolvedWorkspace)) return null;
  return <>{children}</>;
}
