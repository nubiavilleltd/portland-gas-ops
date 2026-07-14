import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/store/authStore";
import { safetyDashboardApi } from "./api";

export const safetyDashboardKeys = {
  detail: ["safety", "dashboard"] as const,
};

export function useSafetyDashboard() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: safetyDashboardKeys.detail,
    queryFn: safetyDashboardApi.get,
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
}
