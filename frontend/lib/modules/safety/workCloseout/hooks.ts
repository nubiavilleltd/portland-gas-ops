import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/store/authStore";
import {
  invalidateSafetyWorkflowCaches,
  writeMappedRecordToSafetyCaches,
} from "../query-cache";
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

  return useQuery({
    queryKey: workCloseoutKeys.list(params),
    queryFn: async () => {
      const items = await workCloseoutsApi.list(params);
      console.log(
        "[work-closeout:list:raw]",
        items.map((item) => ({
          id: item.id,
          reference: item.reference,
          assigned_supervisor_id: item.assigned_supervisor_id,
          assigned_supervisor: item.assigned_supervisor,
          work_authorization: item.work_authorization
            ? {
                assigned_supervisor_id:
                  item.work_authorization.assigned_supervisor_id,
                assigned_supervisor: item.work_authorization.assigned_supervisor,
              }
            : null,
        })),
      );
      const mapped = items.map(mapWorkCloseOutToRequest);
      console.log(
        "[work-closeout:list:mapped]",
        mapped.map((item) => ({
          id: item.id,
          reference: item.reference,
          supervisorId: item.workAuthorization.supervisorId,
          supervisor: item.workAuthorization.supervisor,
        })),
      );
      return mapped;
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
    onSuccess: async (data) => {
      const updated = mapWorkCloseOutToRequest(data);
      writeMappedRecordToSafetyCaches({
        queryClient,
        detailKey: workCloseoutKeys.detail(updated.id),
        listKey: workCloseoutKeys.lists(),
        updated,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workCloseoutKeys.detail(updated.id) }),
        queryClient.invalidateQueries({ queryKey: workCloseoutKeys.lists() }),
        queryClient.invalidateQueries({
          queryKey: ["safety", "work-authorizations", "list"],
        }),
        invalidateSafetyWorkflowCaches(queryClient, "work_closeout", updated.id),
      ]);
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
    onSuccess: async (data) => {
      const updated = mapWorkCloseOutToRequest(data);
      writeMappedRecordToSafetyCaches({
        queryClient,
        detailKey: workCloseoutKeys.detail(id),
        listKey: workCloseoutKeys.lists(),
        updated,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workCloseoutKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: workCloseoutKeys.lists() }),
        queryClient.invalidateQueries({
          queryKey: ["safety", "incident-reports"],
        }),
        invalidateSafetyWorkflowCaches(queryClient, "work_closeout", id),
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
    onSuccess: async (data) => {
      const updated = mapWorkCloseOutToRequest(data);
      writeMappedRecordToSafetyCaches({
        queryClient,
        detailKey: workCloseoutKeys.detail(id),
        listKey: workCloseoutKeys.lists(),
        updated,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workCloseoutKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: workCloseoutKeys.lists() }),
        queryClient.invalidateQueries({
          queryKey: ["safety", "incident-reports"],
        }),
        invalidateSafetyWorkflowCaches(queryClient, "work_closeout", id),
      ]);
    },
  });
}

function useWorkCloseoutDecisionMutation(
  id: string,
  action: (
    id: string,
    payload: WorkCloseOutDecisionCreate,
  ) => ReturnType<typeof workCloseoutsApi.supervisorReview>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: WorkCloseOutDecisionCreate) => action(id, payload),
    onSuccess: async (data) => {
      const updated = mapWorkCloseOutToRequest(data);
      writeMappedRecordToSafetyCaches({
        queryClient,
        detailKey: workCloseoutKeys.detail(id),
        listKey: workCloseoutKeys.lists(),
        updated,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workCloseoutKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: workCloseoutKeys.lists() }),
        invalidateSafetyWorkflowCaches(queryClient, "work_closeout", id),
      ]);
    },
  });
}
