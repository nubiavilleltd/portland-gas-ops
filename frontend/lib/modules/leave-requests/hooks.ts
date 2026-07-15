"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import leaveRequestsApi from "./api";
import { LeaveRequestCreatePayload, ListLeaveRequestsParams } from "./types";

const QUERY_KEYS = {
  all: ["leave-requests"],
  list: (params?: ListLeaveRequestsParams) => [...QUERY_KEYS.all, "list", params],
  detail: (reference: string) => [...QUERY_KEYS.all, "detail", reference],
};

export function useLeaveRequests(params: ListLeaveRequestsParams = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.list(params),
    queryFn: () => leaveRequestsApi.list(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useLeaveRequest(reference: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(reference),
    queryFn: () => leaveRequestsApi.get(reference),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LeaveRequestCreatePayload) => leaveRequestsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
}

export function useCurrentEmployee() {
  return useQuery({
    queryKey: ["current-employee"],
    queryFn: async () => {
      // Try to get employee by user_id
      const response = await fetch("/api/employees/me");
      if (!response.ok) throw new Error("Failed to fetch current employee");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useApprovalAssignments(approvalRequestId?: string) {
  return useQuery({
    queryKey: ["approval-assignments", approvalRequestId],
    queryFn: async () => {
      if (!approvalRequestId) return null;
      const response = await fetch(`/api/workflow/requests/${approvalRequestId}`);
      if (!response.ok) throw new Error("Failed to fetch approval assignments");
      return response.json();
    },
    enabled: !!approvalRequestId,
    staleTime: 5 * 60 * 1000,
  });
}
