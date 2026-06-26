import { useQuery } from "@tanstack/react-query";

import { safetyChecklistsApi } from "./api";
import type { SafetyChecklistParentType, SafetyChecklistStage } from "./types";
import { useAuthStore } from "@/store/authStore";

export const safetyChecklistKeys = {
  all: ["safety", "checklists"] as const,
  active: (parentType: SafetyChecklistParentType, stage: SafetyChecklistStage) =>
    [...safetyChecklistKeys.all, "active", parentType, stage] as const,
};

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
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 401 || status === 429) return false;
      return failureCount < 1;
    },
  });

  return {
    ...query,
    isLoading: query.isLoading,
  };
}
