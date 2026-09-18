"use client";

import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import { API_URL } from "@/lib/constants";
import { useAuthStore } from "@/store/authStore";
import BrandingGate from "@/components/branding/BrandingGate";
import BrandTheme from "@/components/branding/BrandTheme";
import { useCompanyBranding } from "@/lib/company-branding";
import { useWorkspacePreferences } from "@/lib/workspace-preferences";
import {
  fetchCurrentWorkspace,
  toCompanyBranding,
} from "@/lib/workspace-branding-api";

// Module-level singleton — safe to import anywhere (including outside React tree)
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: (failureCount, error: unknown) => {
        // Never retry on 401 — the interceptor handles token refresh; retrying here
        // would flood the refresh endpoint and cause an infinite request storm.
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 401) return false;
        return failureCount < 1;
      },
    },
  },
});

/**
 * On mount, silently attempt to restore the session by exchanging the HttpOnly
 * refresh_token cookie for a new access token. If it succeeds the user stays
 * logged in seamlessly after a page refresh. If it fails (cookie missing/expired)
 * the Zustand store remains empty and the middleware will redirect to /login.
 */
function AuthRestore() {
  useEffect(() => {
    // First, hydrate token from localStorage if available
    useAuthStore.getState().hydrate();

    // Skip if already authenticated (e.g., right after login — token already in memory)
    if (useAuthStore.getState().isAuthenticated) return;

    axios
      .post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true })
      .then(async ({ data }) => {
        const { saveTokens } = await import("@/lib/auth");
        await saveTokens(data.access_token);
      })
      .catch(() => {
        // No valid refresh token — user is not authenticated, middleware will redirect
      });
  }, []);

  return null;
}

function BrandingRestore() {
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (!useCompanyBranding.persist.hasHydrated()) {
      void useCompanyBranding.persist.rehydrate();
    }
    if (!useWorkspacePreferences.persist.hasHydrated()) {
      void useWorkspacePreferences.persist.rehydrate();
    }
  }, []);

  useEffect(() => {
    const branding = useCompanyBranding.getState();

    if (!accessToken) {
      branding.setWorkspaceResolved(false);
      return;
    }

    let cancelled = false;
    branding.setWorkspaceResolved(false);

    fetchCurrentWorkspace()
      .then((workspace) => {
        if (cancelled) return;

        if (workspace.is_configured) {
          useCompanyBranding.getState().setBranding(toCompanyBranding(workspace));
        } else {
          // An authenticated workspace response is authoritative. Do not keep
          // branding cached from another account or an earlier workspace.
          useCompanyBranding.getState().resetBranding();
        }
      })
      .catch(() => {
        if (!cancelled) {
          // A failed workspace lookup must not make stale local branding look
          // like the current server workspace.
          useCompanyBranding.getState().resetBranding();
        }
      })
      .finally(() => {
        if (!cancelled) {
          useCompanyBranding.getState().setWorkspaceResolved(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthRestore />
      <BrandingRestore />
      <BrandTheme />
      <BrandingGate>{children}</BrandingGate>
    </QueryClientProvider>
  );
}
