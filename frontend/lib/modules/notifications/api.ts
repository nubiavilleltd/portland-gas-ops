import api from "@/lib/api";
import type { AppNotification } from "./types";

export const notificationsApi = {
  list: async (params: { skip?: number; limit?: number } = {}): Promise<AppNotification[]> => {
    const { data } = await api.get("/api/notifications/", { params });
    return data;
  },

  count: async (): Promise<{ count: number }> => {
    const { data } = await api.get("/api/notifications/count");
    return data;
  },

  markRead: async (id: string): Promise<void> => {
    await api.patch(`/api/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await api.post("/api/notifications/mark-all-read");
  },

  sendWishes: async (employeeId: string): Promise<void> => {
    await api.post(`/api/notifications/send-wishes/${employeeId}`);
  },
};
