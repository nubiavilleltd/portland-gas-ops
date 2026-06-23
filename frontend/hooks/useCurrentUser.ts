"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { get } from "@/lib/api";
import type { User } from "@/types";

export function useCurrentUser() {
  const { user, setUser, isAuthenticated } = useAuthStore();

  const { data, isLoading, error } = useQuery<User>({
    queryKey: ["current-user"],
    queryFn: () => get<User>("/api/auth/me"),
    enabled: isAuthenticated || !!user,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Sync API response to the store whenever it changes (e.g. after profile picture upload)
  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data, setUser]);

  return {
    user: user ?? data ?? null,
    isLoading: !user && isLoading,
    error,
    isAuthenticated: isAuthenticated || !!data,
  };
}
