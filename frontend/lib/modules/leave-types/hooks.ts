import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leaveTypesApi } from "./api";
import { LeaveTypeCreatePayload, LeaveTypePayload } from "./types";

// Query keys for React Query
const KEYS = {
  all: ["leave-types"],
  list: (params?: any) => [...KEYS.all, "list", params],
  detail: (id: number) => [...KEYS.all, "detail", id],
};

// ════════════════════════════════════════════════════════════════════════════
// QUERIES (Data Fetching)
// ════════════════════════════════════════════════════════════════════════════

export function useLeaveTypes(params?: {
  skip?: number;
  limit?: number;
  is_active?: boolean;
}) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => leaveTypesApi.list(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLeaveType(id: number) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => leaveTypesApi.get(id),
    enabled: !!id, // Skip if no ID
    staleTime: 5 * 60 * 1000,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// MUTATIONS (Create, Update, Delete)
// ════════════════════════════════════════════════════════════════════════════

export function useCreateLeaveType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LeaveTypeCreatePayload) =>
      leaveTypesApi.create(payload),
    onSuccess: () => {
      // Invalidate list to refetch
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useUpdateLeaveType(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LeaveTypePayload) =>
      leaveTypesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
      queryClient.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
}

export function useDeactivateLeaveType(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => leaveTypesApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
      queryClient.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
}

export function useReactivateLeaveType(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => leaveTypesApi.reactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
      queryClient.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
}
