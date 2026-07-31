import api, { postForm } from "@/lib/api";
import type { LeaveRequest } from "@/app/(app)/hr-management/_components/_data";
import { formatDateTime } from "@/lib/utils";
import {
  LeaveRequestListItem,
  LeaveRequestDetail,
  LeaveRequestCreatePayload,
  LeaveRequestListResponse,
  ListLeaveRequestsParams,
} from "./types";

function adaptLeaveRequest(item: LeaveRequestListItem): LeaveRequest {
  return {
    id: item.id,
    ref: item.reference,
    employee: item.employee_name || "—",
    requester: item.requester_name || "—",
    type: item.leave_type_name || "—",
    department: item.department || "—",
    startDate: item.start_date,
    endDate: item.end_date,
    days: item.days,
    reliever: item.reliever_name || "—",
    reason: item.reason,
    status: (item.status.toLowerCase() as any) || "draft",
    date: formatDateTime(item.created_at),
    requestType: (item.request_type as "self" | "others") || "self",
    requesterId: item.requester_id || undefined,
    nextActor: item.next_actor_name || undefined,
    currentStepName: item.current_step_name || undefined,
  };
}

const leaveRequestsApi = {
  async list(params: ListLeaveRequestsParams = {}): Promise<{ data: LeaveRequest[]; total: number; skip: number; limit: number }> {
    const response = await api.get("/api/hr/leave-requests", { params });
    const data: LeaveRequestListResponse = response.data;
    return {
      data: data.data.map(adaptLeaveRequest),
      total: data.total,
      skip: data.skip,
      limit: data.limit,
    };
  },

  async get(id: string): Promise<LeaveRequestDetail> {
    const response = await api.get(`/api/hr/leave-requests/${id}`);
    return response.data;
  },

  async create(payload: LeaveRequestCreatePayload): Promise<LeaveRequestDetail> {
    const response = await api.post("/api/hr/leave-requests", payload);
    return response.data;
  },

  async resubmit(id: string, payload: LeaveRequestCreatePayload): Promise<LeaveRequestDetail> {
    const response = await api.post(`/api/hr/leave-requests/${id}/resubmit`, payload);
    return response.data;
  },

  // Employee marks they are back from open-ended leave (finalizes the End Date).
  async markReturned(id: string, endDate: string): Promise<LeaveRequestDetail> {
    const response = await api.post(`/api/hr/leave-requests/${id}/mark-returned`, { end_date: endDate });
    return response.data;
  },

  // Start the approval workflow for a draft. Uses the shared axios client so it
  // carries the same base URL + auth as every other call (a raw fetch here
  // failed with "Failed to fetch" in production).
  async submitForApproval(
    id: string,
    pickedApprovers?: Record<string, string>,
  ): Promise<{ approval_request_id: string; reference: string; status: string }> {
    const response = await api.post(
      `/api/hr/leave-requests/${id}/submit-for-approval`,
      { picked_approvers: pickedApprovers },
    );
    return response.data;
  },

  async uploadDocument(leaveRequestId: string, file: File): Promise<{ document_id: number; file_name: string; file_url: string }> {
    // Route through the shared axios instance (relative URL → Next rewrite proxy on
    // deploy, auth + credentials handled centrally) — same path procurement uses.
    const formData = new FormData();
    formData.append("file", file);
    return postForm<{ document_id: number; file_name: string; file_url: string }>(
      `/api/hr/leave-requests/${leaveRequestId}/upload-document`,
      formData,
    );
  },
};

export default leaveRequestsApi;
