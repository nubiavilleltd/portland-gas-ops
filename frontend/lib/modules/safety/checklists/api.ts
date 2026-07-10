import api from "@/lib/api";
import type {
  SafetyChecklistResponse,
  SafetyChecklistResponsesCreate,
  SafetyChecklistParentType,
  SafetyChecklistStage,
  SafetyChecklistTemplate,
} from "./types";

export const safetyChecklistsApi = {
  getActive: async (params: {
    parent_type: SafetyChecklistParentType;
    stage: SafetyChecklistStage;
  }): Promise<SafetyChecklistTemplate> => {
    const { data } = await api.get("/api/safety/checklists/active", { params });
    return data;
  },

  createResponses: async (
    payload: SafetyChecklistResponsesCreate,
  ): Promise<SafetyChecklistResponse[]> => {
    const { data } = await api.post("/api/safety/checklists/responses", payload);
    return data;
  },

  listResponses: async (params: {
    parent_type: SafetyChecklistParentType;
    parent_id: string;
  }): Promise<SafetyChecklistResponse[]> => {
    const { data } = await api.get("/api/safety/checklists/responses", { params });
    return data;
  },
};
