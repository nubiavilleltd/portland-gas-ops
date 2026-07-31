import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { notificationsApi } from "./api";

const KEYS = {
  all: ["notifications"] as const,
  list: ["notifications", "list"] as const,
  count: ["notifications", "count"] as const,
};

/** Full notification list — used by the dropdown panel. Polls every 30 s. */
export function useNotifications(params: { skip?: number; limit?: number } = {}) {
  const { accessToken, isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: [...KEYS.list, params],
    queryFn: () => {
      if (!useAuthStore.getState().accessToken) return [];
      return notificationsApi.list(params);
    },
    enabled: isAuthenticated && Boolean(accessToken),
    refetchInterval: isAuthenticated && Boolean(accessToken) ? 30_000 : false,
    retry: false,
  });
}

/** Unread count only — lightweight poll for the bell badge. */
export function useNotificationCount() {
  const { accessToken, isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: KEYS.count,
    queryFn: () => {
      if (!useAuthStore.getState().accessToken) return { count: 0 };
      return notificationsApi.count();
    },
    enabled: isAuthenticated && Boolean(accessToken),
    refetchInterval: isAuthenticated && Boolean(accessToken) ? 15_000 : false,
    retry: false,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useSendBirthdayWishes() {
  return useMutation({
    mutationFn: (employeeId: string) => notificationsApi.sendWishes(employeeId),
  });
}
