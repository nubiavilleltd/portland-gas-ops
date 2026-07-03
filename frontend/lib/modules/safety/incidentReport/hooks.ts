import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/store/authStore";
import { incidentReportsApi } from "./api";
import { mapIncidentReportToHazardReport } from "./mappers";
import type { IncidentReportListParams } from "./types";

export const incidentReportKeys = {
  all: ["safety", "incident-reports"] as const,
  lists: () => [...incidentReportKeys.all, "list"] as const,
  list: (params?: IncidentReportListParams) =>
    [...incidentReportKeys.lists(), params ?? {}] as const,
  detail: (id: string) => [...incidentReportKeys.all, "detail", id] as const,
};

function shouldRetry(failureCount: number, error: unknown) {
  const status = (error as { response?: { status?: number } }).response?.status;
  if (status === 401 || status === 404 || status === 429) return false;
  return failureCount < 1;
}

export function useIncidentReports(params?: IncidentReportListParams) {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: incidentReportKeys.list(params),
    queryFn: async () => {
      const reports = await incidentReportsApi.list(params);
      return reports.map(mapIncidentReportToHazardReport);
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    retry: shouldRetry,
  });
}

export function useIncidentReport(id: string) {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: incidentReportKeys.detail(id),
    queryFn: async () => {
      const report = await incidentReportsApi.getById(id);
      return mapIncidentReportToHazardReport(report);
    },
    enabled: isAuthenticated && Boolean(id),
    staleTime: 60 * 1000,
    retry: shouldRetry,
  });
}
