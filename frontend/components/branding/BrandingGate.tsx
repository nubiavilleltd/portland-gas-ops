"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCompanyBranding } from "@/lib/company-branding";

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
  const { hasHydrated, isConfigured } = useCompanyBranding();
  const isOnboarding = pathname === "/onboarding";
  const isProtectedPath = !isPublicPath(pathname);

  useEffect(() => {
    if (!hasHydrated) return;

    if (isProtectedPath && !isConfigured) {
      router.replace(`/onboarding?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (isOnboarding && isConfigured) {
      router.replace("/home");
    }
  }, [hasHydrated, isConfigured, isOnboarding, isProtectedPath, pathname, router]);

  if (hasHydrated && isProtectedPath && !isConfigured) return null;
  return <>{children}</>;
}
