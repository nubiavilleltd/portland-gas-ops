import api from "@/lib/api";
import type {
  IncidentHseReviewCreate,
  IncidentHseReviewResponse,
  IncidentReportCreate,
  IncidentReportListItem,
  IncidentReportListParams,
  IncidentReportResponse,
  IncidentReportUpdate,
  SafetyActor,
  SafetyActorListParams,
} from "./types";

export const incidentReportsApi = {
  list: async (
    params?: IncidentReportListParams,
  ): Promise<IncidentReportListItem[]> => {
    const { data } = await api.get("/api/safety/incidents", { params });
    return data;
  },

  getById: async (id: string): Promise<IncidentReportResponse> => {
    const { data } = await api.get(`/api/safety/incidents/${id}`);
    return data;
  },

  create: async (
    payload: IncidentReportCreate,
  ): Promise<IncidentReportResponse> => {
    const { data } = await api.post("/api/safety/incidents", payload);
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

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/safety/incidents/${id}`);
  },

  listActors: async (
    params?: SafetyActorListParams,
  ): Promise<SafetyActor[]> => {
    const { data } = await api.get("/api/safety/actors", { params });
    return data;
  },
};
