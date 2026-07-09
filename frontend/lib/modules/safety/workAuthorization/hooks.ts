import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/store/authStore";
import { workAuthorizationsApi } from "./api";
import { mapWorkAuthorizationToRequest } from "./mappers";
import { mapWorkInitiationToRequest } from "../workInitiation/mappers";
import type { WorkAuthorizationListParams, WorkAuthorizationUpdate } from "./types";

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
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workAuthorizationKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: workAuthorizationKeys.lists() }),
      ]);
    },
  });
}
