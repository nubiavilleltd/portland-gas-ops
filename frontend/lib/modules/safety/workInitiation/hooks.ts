import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/store/authStore";
import { mapWorkInitiationToRequest } from "./mappers";
import { workInitiationsApi } from "./api";
import type { WorkInitiationListParams } from "./types";

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
      const details = await Promise.all(
        items.map((item) => workInitiationsApi.getById(item.id)),
      );
      return details.map(mapWorkInitiationToRequest);
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
