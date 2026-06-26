import api from "@/lib/api";
import type {
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
};
