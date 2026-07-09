import api from "@/lib/api";
import type {
  WorkInitiationCreate,
  WorkInitiationListParams,
  WorkInitiationResponse,
  WorkInitiationReviewCreate,
  WorkInitiationUpdate,
} from "./types";

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

  create: async (
    payload: WorkInitiationCreate,
  ): Promise<WorkInitiationResponse> => {
    const { data } = await api.post("/api/safety/work-initiations", payload);
    return data;
  },

  update: async (
    id: string,
    payload: WorkInitiationUpdate,
  ): Promise<WorkInitiationResponse> => {
    const { data } = await api.put(`/api/safety/work-initiations/${id}`, payload);
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
