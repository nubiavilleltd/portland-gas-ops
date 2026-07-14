import api from "@/lib/api";
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
    requestType: item.request_type || "self",
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

  async get(reference: string): Promise<LeaveRequestDetail> {
    const response = await api.get(`/api/hr/leave-requests/${reference}`);
    return response.data;
  },

  async create(payload: LeaveRequestCreatePayload): Promise<LeaveRequestDetail> {
    const response = await api.post("/api/hr/leave-requests", payload);
    return response.data;
  },

  async uploadDocument(leaveRequestId: string, file: File): Promise<{ document_id: number; file_name: string; file_url: string }> {
    // Import auth store dynamically to avoid SSR issues
    const { useAuthStore } = await import("@/store/authStore");
    const token = useAuthStore.getState().accessToken;

    const formData = new FormData();
    formData.append("file", file);

    // Use fetch directly for multipart/form-data to avoid axios header issues
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/hr/leave-requests/${leaveRequestId}/upload-document`, {
      method: "POST",
      body: formData,
      headers: {
        // Do NOT set Content-Type - let browser set it with proper boundary
        ...(token && { "Authorization": `Bearer ${token}` }),
      },
      credentials: "include", // Send cookies
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Upload failed with status ${response.status}`);
    }

    return response.json();
  },
};

export default leaveRequestsApi;
