import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "./api";

const KEYS = {
  all: ["notifications"] as const,
  list: ["notifications", "list"] as const,
  count: ["notifications", "count"] as const,
};

/** Full notification list — used by the dropdown panel. Polls every 30 s. */
export function useNotifications(params: { skip?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: [...KEYS.list, params],
    queryFn: () => notificationsApi.list(params),
    refetchInterval: 30_000,
    retry: false,
  });
}

/** Unread count only — lightweight poll for the bell badge. */
export function useNotificationCount() {
  return useQuery({
    queryKey: KEYS.count,
    queryFn: () => notificationsApi.count(),
    refetchInterval: 15_000,
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
