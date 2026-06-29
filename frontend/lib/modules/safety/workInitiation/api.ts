import api from "@/lib/api";
import type {
  WorkInitiationCreate,
  WorkInitiationListItem,
  WorkInitiationListParams,
  WorkInitiationResponse,
} from "./types";

export const workInitiationsApi = {
  list: async (
    params?: WorkInitiationListParams,
  ): Promise<WorkInitiationListItem[]> => {
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
};
