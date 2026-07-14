import api from "@/lib/api";
import type { SafetyDashboardResponse } from "./types";

export const safetyDashboardApi = {
  get: async (): Promise<SafetyDashboardResponse> => {
    const { data } = await api.get("/api/safety/dashboard");
    return data;
  },
};
