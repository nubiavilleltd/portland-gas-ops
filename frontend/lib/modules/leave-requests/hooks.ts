"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
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
  detail: (id: string) => [...QUERY_KEYS.all, "detail", id],
};

export function useLeaveRequests(params: ListLeaveRequestsParams = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.list(params),
    queryFn: () => leaveRequestsApi.list(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useLeaveRequest(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: () => leaveRequestsApi.get(id),
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

function shouldRetry(failureCount: number, error: unknown) {
  const status = (error as { response?: { status?: number } }).response?.status;
  if (status === 401 || status === 403 || status === 404 || status === 429) {
    return false;
  }
  return failureCount < 1;
}

export function useCurrentEmployee() {
  return useQuery<CurrentEmployee | null, Error>({
    queryKey: ["current-employee"],
    queryFn: async () => {
      try {
        const response = await api.get<CurrentEmployee>("/api/employees/me");
        return response.data;
      } catch (error) {
        const status = (error as { response?: { status?: number } }).response?.status;
        if (status === 404) return null;
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: shouldRetry,
  });
}

export interface ApprovalAssignment {
  id: string;
  approval_request_id: string;
  step_number: number;
  step_name: string;
  assigned_to: string;
  status: string;
  completed_at?: string | null;
}

export function useApprovalAssignments(approvalRequestId?: string) {
  return useQuery({
    queryKey: ["approval-assignments", approvalRequestId],
    queryFn: async () => {
      if (!approvalRequestId) return null;
      try {
        const response = await api.get<ApprovalAssignment[]>(`/api/workflow/requests/${approvalRequestId}`);
        return response.data;
      } catch (error) {
        throw new Error("Failed to fetch approval assignments");
      }
    },
    enabled: !!approvalRequestId,
    staleTime: 5 * 60 * 1000,
    retry: shouldRetry,
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
      try {
        // HR-owned wrapper around the shared workflow endpoint: same auth, same
        // engine, same emails — it additionally notifies the employee when the
        // leave was raised on someone else's behalf. See app/hr/router.py.
        const response = await api.post(
          `/api/hr/leave-requests/approvals/${approvalRequestId}/${action}`,
          { comment: comment || null }
        );
        return response.data;
      } catch (error) {
        const message = (error as { response?: { data?: { detail?: string } } }).response?.data?.detail;
        throw new Error(message || `Failed to ${action} request`);
      }
    },
    onSuccess: (data, variables) => {
      // Refetch leave request data AND workflow queries so the page reflects the
      // new step immediately. my-approvals drives who can act next — invalidating
      // it lets a multi-role approver (e.g. reliever who is also ops manager) see
      // the next step's panel after the data refetches.
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["my-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      queryClient.invalidateQueries({ queryKey: ["audit-trail"] });
      // A final approval deducts leave balance — refresh the balance strip.
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });

      const actionMessages = {
        approve: "Request approved successfully",
        reject: "Request rejected",
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
