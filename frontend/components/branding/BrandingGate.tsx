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
  "/workspace-pending",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export default function BrandingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    hasHydrated,
    hasResolvedWorkspace,
    isConfigured,
    canCompleteOnboarding,
  } = useCompanyBranding();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isOnboarding = pathname === "/onboarding";
  const isProtectedPath = !isPublicPath(pathname);

  useEffect(() => {
    if (!hasHydrated || !accessToken || !hasResolvedWorkspace) return;

    if (pathname === "/") {
      if (!isConfigured) {
        router.replace(
          canCompleteOnboarding ? "/onboarding" : "/workspace-pending",
        );
      }
      return;
    }

    if (isProtectedPath && !isConfigured) {
      router.replace(
        canCompleteOnboarding
          ? `/onboarding?next=${encodeURIComponent(pathname)}`
          : "/workspace-pending",
      );
      return;
    }

    if (isOnboarding && isConfigured) {
      router.replace("/");
      return;
    }

    if (isOnboarding && !isConfigured && !canCompleteOnboarding) {
      router.replace("/workspace-pending");
    }
  }, [accessToken, canCompleteOnboarding, hasHydrated, hasResolvedWorkspace, isConfigured, isOnboarding, isProtectedPath, pathname, router]);

  if (isProtectedPath && accessToken && (!hasHydrated || !hasResolvedWorkspace || !isConfigured)) return null;
  return <>{children}</>;
}
