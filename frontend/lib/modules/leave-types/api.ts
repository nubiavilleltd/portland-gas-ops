import api from "@/lib/api";
import {
  LeaveTypeListItem,
  LeaveTypeDetail,
  LeaveTypeCreatePayload,
  LeaveTypePayload,
  LeaveTypeListResponse,
} from "./types";

export const leaveTypesApi = {
  // List all leave types
  list: async (params?: {
    skip?: number;
    limit?: number;
    is_active?: boolean;
  }): Promise<LeaveTypeListResponse> => {
    const { data } = await api.get("/api/hr/leave-types", { params });
    return data;
  },

  // Get single leave type
  get: async (id: number): Promise<LeaveTypeDetail> => {
    const { data } = await api.get(`/api/hr/leave-types/${id}`);
    return data;
  },

  // Create leave type
  create: async (payload: LeaveTypeCreatePayload): Promise<LeaveTypeDetail> => {
    const { data } = await api.post("/api/hr/leave-types", payload);
    return data;
  },

  // Update leave type
  update: async (
    id: number,
    payload: LeaveTypePayload
  ): Promise<LeaveTypeDetail> => {
    const { data } = await api.put(`/api/hr/leave-types/${id}`, payload);
    return data;
  },

  // Deactivate leave type
  deactivate: async (id: number): Promise<LeaveTypeDetail> => {
    const { data } = await api.patch(
      `/api/hr/leave-types/${id}/deactivate`
    );
    return data;
  },

  // Reactivate leave type
  reactivate: async (id: number): Promise<LeaveTypeDetail> => {
    const { data } = await api.patch(
      `/api/hr/leave-types/${id}/reactivate`
    );
    return data;
  },
};
