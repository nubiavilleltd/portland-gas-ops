import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/store/authStore";
import { safetyPeopleApi } from "./api";
import type { SafetyActorListParams } from "./types";

export const safetyPeopleKeys = {
  all: ["safety", "people"] as const,
  currentEmployee: () => [...safetyPeopleKeys.all, "current-employee"] as const,
  actors: (params?: SafetyActorListParams) =>
    [...safetyPeopleKeys.all, "actors", params ?? {}] as const,
  departments: () => [...safetyPeopleKeys.all, "departments"] as const,
};

function shouldRetry(failureCount: number, error: unknown) {
  const status = (error as { response?: { status?: number } }).response?.status;
  if (status === 401 || status === 403 || status === 404 || status === 429) {
    return false;
  }
  return failureCount < 1;
}

export function useSafetyActors(
  params?: SafetyActorListParams,
  options?: { enabled?: boolean },
) {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: safetyPeopleKeys.actors(params),
    queryFn: () => safetyPeopleApi.listActors(params),
    enabled: isAuthenticated && (options?.enabled ?? true),
    staleTime: 60 * 1000,
    retry: shouldRetry,
  });
}

export function useSafetyCurrentEmployee() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: safetyPeopleKeys.currentEmployee(),
    queryFn: () => safetyPeopleApi.getCurrentEmployee(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: shouldRetry,
  });
}

export function useSafetyDepartments() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: safetyPeopleKeys.departments(),
    queryFn: () => safetyPeopleApi.listDepartments(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: shouldRetry,
  });
}
