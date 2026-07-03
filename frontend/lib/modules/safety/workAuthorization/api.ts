import api from "@/lib/api";
import type {
  WorkAuthorizationCreate,
  WorkAuthorizationHseReviewCreate,
  WorkAuthorizationListParams,
  WorkAuthorizationResponse,
} from "./types";

export const workAuthorizationsApi = {
  list: async (
    params?: WorkAuthorizationListParams,
  ): Promise<WorkAuthorizationResponse[]> => {
    const { data } = await api.get("/api/safety/work-authorizations", { params });
    return data;
  },

  getById: async (id: string): Promise<WorkAuthorizationResponse> => {
    const { data } = await api.get(`/api/safety/work-authorizations/${id}`);
    return data;
  },

  create: async (
    payload: WorkAuthorizationCreate,
    attachments: File[] = [],
  ): Promise<WorkAuthorizationResponse> => {
    const form = new FormData();
    form.append("data", JSON.stringify(payload));
    attachments.forEach((file) => form.append("attachments", file));

    const { data } = await api.post("/api/safety/work-authorizations", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  createHseReview: async (
    id: string,
    payload: WorkAuthorizationHseReviewCreate,
    evidence: File[] = [],
  ): Promise<WorkAuthorizationResponse> => {
    const form = new FormData();
    form.append("data", JSON.stringify(payload));
    evidence.forEach((file) => form.append("hse_evidence", file));

    const { data } = await api.post(
      `/api/safety/work-authorizations/${id}/hse-review`,
      form,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return data;
  },
};
