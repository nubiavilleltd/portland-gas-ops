import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/store/authStore";
import {
  queueSafetyInvalidations,
  writeMappedRecordToSafetyCaches,
} from "../query-cache";
import { incidentReportsApi } from "./api";
import { mapIncidentReportToHazardReport } from "./mappers";
import { mapWorkAuthorizationToRequest } from "../workAuthorization/mappers";
import type {
  IncidentHseReviewCreate,
  IncidentHseVerificationCreate,
  IncidentReportListParams,
  IncidentResolveCreate,
} from "./types";

export const incidentReportKeys = {
  all: ["safety", "incident-reports"] as const,
  lists: () => [...incidentReportKeys.all, "list"] as const,
  list: (params?: IncidentReportListParams) =>
    [...incidentReportKeys.lists(), params ?? {}] as const,
  detail: (id: string) => [...incidentReportKeys.all, "detail", id] as const,
  eligibleWorkAuthorizations: () =>
    [...incidentReportKeys.all, "eligible-work-authorizations"] as const,
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

export function useEligibleWorkAuthorizationsForIncident() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: incidentReportKeys.eligibleWorkAuthorizations(),
    queryFn: async () => {
      const authorizations = await incidentReportsApi.eligibleWorkAuthorizations();
      return authorizations.map(mapWorkAuthorizationToRequest);
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    retry: shouldRetry,
  });
}

export function useResolveIncidentWithCloseout(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: IncidentResolveCreate) =>
      incidentReportsApi.resolveWithCloseout(id, payload),
    onSuccess: (data) => {
      const updated = mapIncidentReportToHazardReport(data);
      writeMappedRecordToSafetyCaches({
        queryClient,
        detailKey: incidentReportKeys.detail(id),
        listKey: incidentReportKeys.lists(),
        updated,
      });
      queueSafetyInvalidations([
        queryClient.invalidateQueries({ queryKey: incidentReportKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: incidentReportKeys.lists() }),
      ]);
    },
  });
}

export function useCloseIncident(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: IncidentHseVerificationCreate) =>
      incidentReportsApi.close(id, payload),
    onSuccess: (data) => {
      const updated = mapIncidentReportToHazardReport(data);
      writeMappedRecordToSafetyCaches({
        queryClient,
        detailKey: incidentReportKeys.detail(id),
        listKey: incidentReportKeys.lists(),
        updated,
      });
      queueSafetyInvalidations([
        queryClient.invalidateQueries({ queryKey: incidentReportKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: incidentReportKeys.lists() }),
      ]);
    },
  });
}

export function useMarkIncidentNotResolved(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: IncidentHseVerificationCreate) =>
      incidentReportsApi.markNotResolved(id, payload),
    onSuccess: (data) => {
      const updated = mapIncidentReportToHazardReport(data);
      writeMappedRecordToSafetyCaches({
        queryClient,
        detailKey: incidentReportKeys.detail(id),
        listKey: incidentReportKeys.lists(),
        updated,
      });
      queueSafetyInvalidations([
        queryClient.invalidateQueries({ queryKey: incidentReportKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: incidentReportKeys.lists() }),
      ]);
    },
  });
}

export function useCreateIncidentHseReview(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: IncidentHseReviewCreate) =>
      incidentReportsApi.createHseReview(id, payload),
    onSuccess: () => {
      queueSafetyInvalidations([
        queryClient.invalidateQueries({ queryKey: incidentReportKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: incidentReportKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: ["my-approvals"] }),
        queryClient.invalidateQueries({ queryKey: ["my-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["audit-trail", "incident_report", id] }),
      ]);
    },
  });
}
