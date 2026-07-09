import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/store/authStore";
import { workCloseoutsApi } from "./api";
import { mapWorkCloseOutToRequest } from "./mappers";
import type {
  WorkCloseOutCreate,
  WorkCloseOutDecisionCreate,
  WorkCloseOutHseReviewCreate,
  WorkCloseOutListParams,
  WorkCloseOutUpdate,
} from "./types";

export const workCloseoutKeys = {
  all: ["safety", "work-closeouts"] as const,
  lists: () => [...workCloseoutKeys.all, "list"] as const,
  list: (params?: WorkCloseOutListParams) =>
    [...workCloseoutKeys.lists(), params ?? {}] as const,
  detail: (id: string) => [...workCloseoutKeys.all, "detail", id] as const,
};

function shouldRetry(failureCount: number, error: unknown) {
  const status = (error as { response?: { status?: number } }).response?.status;
  if (status === 401 || status === 404 || status === 409 || status === 429) {
    return false;
  }
  return failureCount < 1;
}

export function useWorkCloseouts(params?: WorkCloseOutListParams) {
  const { isAuthenticated } = useAuthStore();

  console.log("useWorkCloseouts params", params, isAuthenticated);

  return useQuery({
    queryKey: workCloseoutKeys.list(params),
    queryFn: async () => {
      const items = await workCloseoutsApi.list(params);
      console.log("items", items);
      return items.map(mapWorkCloseOutToRequest);
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    retry: shouldRetry,
  });
}

export function useWorkCloseout(id: string) {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: workCloseoutKeys.detail(id),
    queryFn: async () => {
      const item = await workCloseoutsApi.getById(id);
      return mapWorkCloseOutToRequest(item);
    },
    enabled: isAuthenticated && Boolean(id),
    staleTime: 60 * 1000,
    retry: shouldRetry,
  });
}

export function useCreateWorkCloseout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      completionEvidence = [],
    }: {
      payload: WorkCloseOutCreate;
      completionEvidence?: File[];
    }) => workCloseoutsApi.create(payload, completionEvidence),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workCloseoutKeys.lists() });
    },
  });
}

export function useUpdateWorkCloseout(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      completionEvidence = [],
    }: {
      payload: WorkCloseOutUpdate;
      completionEvidence?: File[];
    }) => workCloseoutsApi.update(id, payload, completionEvidence),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workCloseoutKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: workCloseoutKeys.lists() }),
      ]);
    },
  });
}

export function useSupervisorWorkCloseoutReview(id: string) {
  return useWorkCloseoutDecisionMutation(id, workCloseoutsApi.supervisorReview);
}

export function useOperationsHeadWorkCloseoutReview(id: string) {
  return useWorkCloseoutDecisionMutation(id, workCloseoutsApi.operationsHeadReview);
}

export function useHseWorkCloseoutReview(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: WorkCloseOutHseReviewCreate) =>
      workCloseoutsApi.hseReview(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workCloseoutKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: workCloseoutKeys.lists() }),
      ]);
    },
  });
}

function useWorkCloseoutDecisionMutation(
  id: string,
  action: (
    id: string,
    payload: WorkCloseOutDecisionCreate,
  ) => Promise<unknown>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: WorkCloseOutDecisionCreate) => action(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workCloseoutKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: workCloseoutKeys.lists() }),
      ]);
    },
  });
}
