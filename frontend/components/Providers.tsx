"use client";

import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import { API_URL } from "@/lib/constants";
import { useAuthStore } from "@/store/authStore";

// Module-level singleton — safe to import anywhere (including outside React tree)
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
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
    // Skip if already authenticated (e.g., right after login — token already in memory)
<<<<<<< HEAD
    if (useAuthStore.getState().isAuthenticated) return;
=======
    if (useAuthStore.getState().isAuthenticated) {
      useAuthStore.getState().setAuthReady(true);
      return;
    }
>>>>>>> c7b4c06 (merging)

    axios
      .post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true })
      .then(async ({ data }) => {
        const { saveTokens } = await import("@/lib/auth");
        await saveTokens(data.access_token);
      })
      .catch(() => {
        // No valid refresh token — user is not authenticated, middleware will redirect
<<<<<<< HEAD
=======
      })
      .finally(() => {
        useAuthStore.getState().setAuthReady(true);
>>>>>>> c7b4c06 (merging)
      });
  }, []);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthRestore />
      {children}
    </QueryClientProvider>
  );
}
