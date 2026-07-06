import api from "@/lib/api";
import type {
  WorkCloseOutCreate,
  WorkCloseOutDecisionCreate,
  WorkCloseOutHseReviewCreate,
  WorkCloseOutListParams,
  WorkCloseOutResponse,
} from "./types";

export const workCloseoutsApi = {
  list: async (
    params?: WorkCloseOutListParams,
  ): Promise<WorkCloseOutResponse[]> => {
    const { data } = await api.get("/api/safety/work-closeouts", { params });
    return data;
  },

  getById: async (id: string): Promise<WorkCloseOutResponse> => {
    const { data } = await api.get(`/api/safety/work-closeouts/${id}`);
    return data;
  },

  create: async (
    payload: WorkCloseOutCreate,
    completionEvidence: File[] = [],
  ): Promise<WorkCloseOutResponse> => {
    const form = new FormData();
    form.append("data", JSON.stringify(payload));
    completionEvidence.forEach((file) =>
      form.append("completion_evidence", file),
    );

    const { data } = await api.post("/api/safety/work-closeouts", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  supervisorReview: async (
    id: string,
    payload: WorkCloseOutDecisionCreate,
  ): Promise<WorkCloseOutResponse> => {
    const { data } = await api.post(
      `/api/safety/work-closeouts/${id}/supervisor-review`,
      payload,
    );
    return data;
  },

  operationsHeadReview: async (
    id: string,
    payload: WorkCloseOutDecisionCreate,
  ): Promise<WorkCloseOutResponse> => {
    const { data } = await api.post(
      `/api/safety/work-closeouts/${id}/operations-head-review`,
      payload,
    );
    return data;
  },

  hseReview: async (
    id: string,
    payload: WorkCloseOutHseReviewCreate,
  ): Promise<WorkCloseOutResponse> => {
    const { data } = await api.post(
      `/api/safety/work-closeouts/${id}/hse-review`,
      payload,
    );
    return data;
  },
};
