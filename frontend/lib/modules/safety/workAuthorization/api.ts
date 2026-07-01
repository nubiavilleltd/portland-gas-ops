import api from "@/lib/api";
import type {
  WorkAuthorizationCreate,
  WorkAuthorizationHseReviewCreate,
  WorkAuthorizationListItem,
  WorkAuthorizationListParams,
  WorkAuthorizationResponse,
} from "./types";

export const workAuthorizationsApi = {
  list: async (
    params?: WorkAuthorizationListParams,
  ): Promise<WorkAuthorizationListItem[]> => {
    const { data } = await api.get("/api/safety/work-authorizations", { params });
    return data;
  },

  getById: async (id: string): Promise<WorkAuthorizationResponse> => {
    const { data } = await api.get(`/api/safety/work-authorizations/${id}`);
    return data;
  },

  create: async (
    payload: WorkAuthorizationCreate,
  ): Promise<WorkAuthorizationResponse> => {
    const { data } = await api.post("/api/safety/work-authorizations", payload);
    return data;
  },

  createHseReview: async (
    id: string,
    payload: WorkAuthorizationHseReviewCreate,
  ): Promise<WorkAuthorizationResponse> => {
    const { data } = await api.post(
      `/api/safety/work-authorizations/${id}/hse-review`,
      payload,
    );
    return data;
  },
};
