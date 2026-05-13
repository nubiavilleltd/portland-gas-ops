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
    enabled: !user, // only fetch if not already in store
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (data && !user) {
      setUser(data);
    }
  }, [data, user, setUser]);

  return {
    user: user ?? data ?? null,
    isLoading: !user && isLoading,
    error,
    isAuthenticated: isAuthenticated || !!data,
  };
}
