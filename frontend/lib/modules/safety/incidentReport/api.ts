import api from "@/lib/api";
import type {
  IncidentHseReviewCreate,
  IncidentHseVerificationCreate,
  IncidentHseReviewResponse,
  IncidentReportCreate,
  IncidentReportListParams,
  IncidentReportResponse,
  IncidentReportUpdate,
  IncidentResolveCreate,
} from "./types";

export const incidentReportsApi = {
  list: async (
    params?: IncidentReportListParams,
  ): Promise<IncidentReportResponse[]> => {
    const { data } = await api.get("/api/safety/incidents", { params });
    return data;
  },

  getById: async (id: string): Promise<IncidentReportResponse> => {
    const { data } = await api.get(`/api/safety/incidents/${id}`);
    return data;
  },

  create: async (
    payload: IncidentReportCreate,
    attachments: File[] = [],
  ): Promise<IncidentReportResponse> => {
    const form = new FormData();
    form.append("data", JSON.stringify(payload));
    attachments.forEach((file) => form.append("attachments", file));

    const { data } = await api.post("/api/safety/incidents", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  createHseReview: async (
    id: string,
    payload: IncidentHseReviewCreate,
  ): Promise<IncidentHseReviewResponse> => {
    const { data } = await api.post(`/api/safety/incidents/${id}/hse-review`, payload);
    return data;
  },

  update: async (
    id: string,
    payload: IncidentReportUpdate,
  ): Promise<IncidentReportResponse> => {
    const { data } = await api.patch(`/api/safety/incidents/${id}`, payload);
    return data;
  },

  resolveWithCloseout: async (
    id: string,
    payload: IncidentResolveCreate,
  ): Promise<IncidentReportResponse> => {
    const { data } = await api.post(`/api/safety/incidents/${id}/resolve`, payload);
    return data;
  },

  close: async (
    id: string,
    payload: IncidentHseVerificationCreate,
  ): Promise<IncidentReportResponse> => {
    const { data } = await api.post(`/api/safety/incidents/${id}/close`, payload);
    return data;
  },

  markNotResolved: async (
    id: string,
    payload: IncidentHseVerificationCreate,
  ): Promise<IncidentReportResponse> => {
    const { data } = await api.post(
      `/api/safety/incidents/${id}/not-resolved`,
      payload,
    );
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/safety/incidents/${id}`);
  },

};
