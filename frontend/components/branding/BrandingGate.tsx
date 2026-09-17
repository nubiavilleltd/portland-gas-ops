"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCompanyBranding } from "@/lib/company-branding";
import { useAuthStore } from "@/store/authStore";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/verify-otp",
  "/reset-password",
  "/setup-account",
  "/onboarding",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export default function BrandingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasHydrated, hasResolvedWorkspace, isConfigured } = useCompanyBranding();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isOnboarding = pathname === "/onboarding";
  const isProtectedPath = !isPublicPath(pathname);

  useEffect(() => {
    if (!hasHydrated || !accessToken || !hasResolvedWorkspace) return;

    if (isProtectedPath && !isConfigured) {
      router.replace(`/onboarding?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (isOnboarding && isConfigured) {
      router.replace("/home");
    }
  }, [accessToken, hasHydrated, hasResolvedWorkspace, isConfigured, isOnboarding, isProtectedPath, pathname, router]);

  if (isProtectedPath && accessToken && (!hasHydrated || !hasResolvedWorkspace || !isConfigured)) return null;
  return <>{children}</>;
}
