import api from "@/lib/api";
import type {
  WorkInitiationCreate,
  WorkInitiationListParams,
  WorkInitiationResponse,
  WorkInitiationReviewCreate,
  WorkInitiationUpdate,
} from "./types";
import type { IncidentReportResponse } from "../incidentReport/types";

export const workInitiationsApi = {
  list: async (
    params?: WorkInitiationListParams,
  ): Promise<WorkInitiationResponse[]> => {
    const { data } = await api.get("/api/safety/work-initiations", { params });
    return data;
  },

  getById: async (id: string): Promise<WorkInitiationResponse> => {
    const { data } = await api.get(`/api/safety/work-initiations/${id}`);
    return data;
  },

  eligibleIncidents: async (): Promise<IncidentReportResponse[]> => {
    const { data } = await api.get(
      "/api/safety/work-initiations/eligible-incidents",
    );
    return data;
  },

  create: async (
    payload: WorkInitiationCreate,
    attachments: File[] = [],
  ): Promise<WorkInitiationResponse> => {
    const form = new FormData();
    form.append("data", JSON.stringify(payload));
    attachments.forEach((file) => form.append("attachments", file));

    const { data } = await api.post("/api/safety/work-initiations", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  update: async (
    id: string,
    payload: WorkInitiationUpdate,
    attachments: File[] = [],
  ): Promise<WorkInitiationResponse> => {
    const form = new FormData();
    form.append("data", JSON.stringify(payload));
    attachments.forEach((file) => form.append("attachments", file));

    const { data } = await api.put(`/api/safety/work-initiations/${id}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  supervisorReview: async (
    id: string,
    payload: WorkInitiationReviewCreate,
  ): Promise<WorkInitiationResponse> => {
    const { data } = await api.post(`/api/safety/work-initiations/${id}/supervisor-review`, payload);
    return data;
  },

  operationsHodReview: async (
    id: string,
    payload: WorkInitiationReviewCreate,
  ): Promise<WorkInitiationResponse> => {
    const { data } = await api.post(`/api/safety/work-initiations/${id}/operations-hod-review`, payload);
    return data;
  },
};
