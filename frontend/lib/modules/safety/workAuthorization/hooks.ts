import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/store/authStore";
import {
  invalidateSafetyWorkflowCaches,
  queueSafetyInvalidations,
  writeMappedRecordToSafetyCaches,
} from "../query-cache";
import { workAuthorizationsApi } from "./api";
import { mapWorkAuthorizationToRequest } from "./mappers";
import { mapWorkInitiationToRequest } from "../workInitiation/mappers";
import type {
  WorkAuthorizationCreate,
  WorkAuthorizationHseReviewCreate,
  WorkAuthorizationListParams,
  WorkAuthorizationUpdate,
} from "./types";

export const workAuthorizationKeys = {
  all: ["safety", "work-authorizations"] as const,
  lists: () => [...workAuthorizationKeys.all, "list"] as const,
  list: (params?: WorkAuthorizationListParams) =>
    [...workAuthorizationKeys.lists(), params ?? {}] as const,
  detail: (id: string) => [...workAuthorizationKeys.all, "detail", id] as const,
  eligibleWorkInitiations: () =>
    [...workAuthorizationKeys.all, "eligible-work-initiations"] as const,
};

function shouldRetry(failureCount: number, error: unknown) {
  const status = (error as { response?: { status?: number } }).response?.status;
  if (status === 401 || status === 404 || status === 429) return false;
  return failureCount < 1;
}

export function useWorkAuthorizations(params?: WorkAuthorizationListParams) {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: workAuthorizationKeys.list(params),
    queryFn: async () => {
      const items = await workAuthorizationsApi.list(params);
      return items.map(mapWorkAuthorizationToRequest);
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    retry: shouldRetry,
  });
}

export function useWorkAuthorization(id: string) {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: workAuthorizationKeys.detail(id),
    queryFn: async () => {
      const item = await workAuthorizationsApi.getById(id);
      return mapWorkAuthorizationToRequest(item);
    },
    enabled: isAuthenticated && Boolean(id),
    staleTime: 60 * 1000,
    retry: shouldRetry,
  });
}

export function useEligibleWorkInitiationsForAuthorization() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: workAuthorizationKeys.eligibleWorkInitiations(),
    queryFn: async () => {
      const items = await workAuthorizationsApi.eligibleWorkInitiations();
      return items.map(mapWorkInitiationToRequest);
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    retry: shouldRetry,
  });
}

export function useCreateWorkAuthorization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      attachments = [],
    }: {
      payload: WorkAuthorizationCreate;
      attachments?: File[];
    }) => workAuthorizationsApi.create(payload, attachments),
    onSuccess: (data) => {
      const updated = mapWorkAuthorizationToRequest(data);
      writeMappedRecordToSafetyCaches({
        queryClient,
        detailKey: workAuthorizationKeys.detail(updated.id),
        listKey: workAuthorizationKeys.lists(),
        updated,
      });
      queueSafetyInvalidations([
        queryClient.invalidateQueries({ queryKey: workAuthorizationKeys.detail(updated.id) }),
        queryClient.invalidateQueries({ queryKey: workAuthorizationKeys.lists() }),
        queryClient.invalidateQueries({
          queryKey: workAuthorizationKeys.eligibleWorkInitiations(),
        }),
        invalidateSafetyWorkflowCaches(queryClient, "work_authorization", updated.id),
      ]);
    },
  });
}

export function useUpdateWorkAuthorization(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      attachments = [],
    }: {
      payload: WorkAuthorizationUpdate;
      attachments?: File[];
    }) => workAuthorizationsApi.update(id, payload, attachments),
    onSuccess: (data) => {
      const updated = mapWorkAuthorizationToRequest(data);
      writeMappedRecordToSafetyCaches({
        queryClient,
        detailKey: workAuthorizationKeys.detail(id),
        listKey: workAuthorizationKeys.lists(),
        updated,
      });
      queueSafetyInvalidations([
        queryClient.invalidateQueries({ queryKey: workAuthorizationKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: workAuthorizationKeys.lists() }),
        queryClient.invalidateQueries({
          queryKey: workAuthorizationKeys.eligibleWorkInitiations(),
        }),
        invalidateSafetyWorkflowCaches(queryClient, "work_authorization", id),
      ]);
    },
  });
}

export function useHseReviewWorkAuthorization(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      evidence = [],
    }: {
      payload: WorkAuthorizationHseReviewCreate;
      evidence?: File[];
    }) => workAuthorizationsApi.createHseReview(id, payload, evidence),
    onSuccess: (data) => {
      const updated = mapWorkAuthorizationToRequest(data);
      writeMappedRecordToSafetyCaches({
        queryClient,
        detailKey: workAuthorizationKeys.detail(id),
        listKey: workAuthorizationKeys.lists(),
        updated,
      });
      queueSafetyInvalidations([
        queryClient.invalidateQueries({ queryKey: workAuthorizationKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: workAuthorizationKeys.lists() }),
        invalidateSafetyWorkflowCaches(queryClient, "work_authorization", id),
      ]);
    },
  });
}
