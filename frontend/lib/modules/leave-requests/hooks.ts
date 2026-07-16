"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import leaveRequestsApi from "./api";
import { useToast } from "@/hooks/useToast";
import { LeaveRequestCreatePayload, ListLeaveRequestsParams } from "./types";

// Match the backend's EmployeeResponse structure
export interface CurrentEmployee {
  id: string;  // Employee ID (what we need for comparison)
  user_id: string;
  employee_no: string;
  job_title?: string | null;
  department?: string | null;
  department_id?: string | null;
  user?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email: string;
    role: string;
  } | null;
}

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
  return useQuery<CurrentEmployee | null, Error>({
    queryKey: ["current-employee"],
    queryFn: async () => {
      const response = await fetch("/api/employees/me");
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch current employee");
      }
      return response.json() as Promise<CurrentEmployee>;
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

export function useApproveLeaveRequest() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({
      approvalRequestId,
      action,
      comment,
    }: {
      approvalRequestId: string;
      action: "approve" | "reject" | "return";
      comment?: string;
    }) => {
      const response = await fetch(
        `/api/workflow/requests/${approvalRequestId}/${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comment: comment || null }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || `Failed to ${action} request`);
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate all leave request queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });

      const actionMessages = {
        approve: "Request approved successfully",
        reject: "Request denied",
        return: "Request returned to requester",
      };

      toast.success(actionMessages[variables.action]);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to process approval";
      toast.error(message);
    },
  });
}
