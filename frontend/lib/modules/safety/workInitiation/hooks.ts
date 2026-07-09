import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/store/authStore";
import { mapWorkInitiationToRequest } from "./mappers";
import { workInitiationsApi } from "./api";
import type { WorkInitiationListParams, WorkInitiationReviewCreate, WorkInitiationUpdate } from "./types";

export const workInitiationKeys = {
  all: ["safety", "work-initiations"] as const,
  lists: () => [...workInitiationKeys.all, "list"] as const,
  list: (params?: WorkInitiationListParams) =>
    [...workInitiationKeys.lists(), params ?? {}] as const,
  detail: (id: string) => [...workInitiationKeys.all, "detail", id] as const,
};

function shouldRetry(failureCount: number, error: unknown) {
  const status = (error as { response?: { status?: number } }).response?.status;
  if (status === 401 || status === 404 || status === 429) return false;
  return failureCount < 1;
}

export function useWorkInitiations(params?: WorkInitiationListParams) {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: workInitiationKeys.list(params),
    queryFn: async () => {
      const items = await workInitiationsApi.list(params);
      return items.map(mapWorkInitiationToRequest);
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    retry: shouldRetry,
  });
}

export function useWorkInitiation(id: string) {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: workInitiationKeys.detail(id),
    queryFn: async () => {
      const item = await workInitiationsApi.getById(id);
      return mapWorkInitiationToRequest(item);
    },
    enabled: isAuthenticated && Boolean(id),
    staleTime: 60 * 1000,
    retry: shouldRetry,
  });
}

export function useSupervisorReviewWorkInitiation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: WorkInitiationReviewCreate;
    }) => workInitiationsApi.supervisorReview(id, payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: workInitiationKeys.detail(variables.id),
        }),
        queryClient.invalidateQueries({
          queryKey: workInitiationKeys.lists(),
        }),
      ]);
    },
  });
}


export function useOperationsHodReviewWorkInitiation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: WorkInitiationReviewCreate;
    }) => workInitiationsApi.operationsHodReview(id, payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: workInitiationKeys.detail(variables.id),
        }),
        queryClient.invalidateQueries({
          queryKey: workInitiationKeys.lists(),
        }),
      ]);
    },
  });
}

export function useUpdateWorkInitiation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: WorkInitiationUpdate) =>
      workInitiationsApi.update(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workInitiationKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: workInitiationKeys.lists() }),
      ]);
    },
  });
}
