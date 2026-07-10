import api from "@/lib/api";
import type {
  SafetyActor,
  SafetyActorListParams,
  SafetyDepartment,
  SafetyEmployeeProfile,
} from "./types";

export const safetyPeopleApi = {
  getCurrentEmployee: async (): Promise<SafetyEmployeeProfile> => {
    const { data } = await api.get("/api/employees/me");
    return data;
  },

  listActors: async (
    params?: SafetyActorListParams,
  ): Promise<SafetyActor[]> => {
    const { data } = await api.get("/api/safety/actors", { params });
    return data;
  },

  listDepartments: async (): Promise<SafetyDepartment[]> => {
    const { data } = await api.get("/api/safety/actors/departments");
    return data;
  },
};
