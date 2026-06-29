import { useQuery } from "@tanstack/react-query";

import { safetyChecklistsApi } from "./api";
import type { SafetyChecklistParentType, SafetyChecklistStage } from "./types";
import { useAuthStore } from "@/store/authStore";

export const safetyChecklistKeys = {
  all: ["safety", "checklists"] as const,
  active: (parentType: SafetyChecklistParentType, stage: SafetyChecklistStage) =>
    [...safetyChecklistKeys.all, "active", parentType, stage] as const,
  responses: (parentType: SafetyChecklistParentType, parentId: string) =>
    [...safetyChecklistKeys.all, "responses", parentType, parentId] as const,
};

function shouldRetry(failureCount: number, error: unknown) {
  const status = (error as { response?: { status?: number } }).response?.status;
  if (status === 401 || status === 404 || status === 429) return false;
  return failureCount < 1;
}

export function useActiveSafetyChecklist(
  parentType: SafetyChecklistParentType,
  stage: SafetyChecklistStage,
) {
  const { isAuthenticated } = useAuthStore();
  const query = useQuery({
    queryKey: safetyChecklistKeys.active(parentType, stage),
    queryFn: () =>
      safetyChecklistsApi.getActive({
        parent_type: parentType,
        stage,
      }),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: shouldRetry,
  });

  return {
    ...query,
    isLoading: query.isLoading,
  };
}

export function useSafetyChecklistResponses(
  parentType: SafetyChecklistParentType,
  parentId: string,
) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: safetyChecklistKeys.responses(parentType, parentId),
    queryFn: () =>
      safetyChecklistsApi.listResponses({
        parent_type: parentType,
        parent_id: parentId,
      }),
    enabled: isAuthenticated && Boolean(parentId),
    staleTime: 60 * 1000,
    retry: shouldRetry,
  });
}
