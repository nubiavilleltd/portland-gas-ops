"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Module-level singleton — safe to import anywhere (including outside React tree)
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
