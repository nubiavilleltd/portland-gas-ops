import api from "@/lib/api";
import {
  LeaveRequestListItem,
  LeaveRequestDetail,
  LeaveRequestCreatePayload,
  LeaveRequestListResponse,
  ListLeaveRequestsParams,
} from "./types";

const leaveRequestsApi = {
  async list(params: ListLeaveRequestsParams = {}): Promise<LeaveRequestListResponse> {
    const response = await api.get("/api/hr/leave-requests", { params });
    return response.data;
  },

  async get(reference: string): Promise<LeaveRequestDetail> {
    const response = await api.get(`/api/hr/leave-requests/${reference}`);
    return response.data;
  },

  async create(payload: LeaveRequestCreatePayload): Promise<LeaveRequestDetail> {
    const response = await api.post("/api/hr/leave-requests", payload);
    return response.data;
  },
};

export default leaveRequestsApi;
