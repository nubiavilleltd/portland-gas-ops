"use client";

import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import type { Group, GroupListItem } from "@/types/setups";

export const setupsKeys = {
  groups:    () => ["setups", "groups"] as const,
  group:     (id: string) => ["setups", "groups", id] as const,
};

export function useGroups() {
  return useQuery<GroupListItem[]>({
    queryKey: setupsKeys.groups(),
    queryFn:  () => get<GroupListItem[]>("/api/setups/groups"),
    staleTime: 30 * 1000,
  });
}

export function useGroup(id: string) {
  return useQuery<Group>({
    queryKey: setupsKeys.group(id),
    queryFn:  () => get<Group>(`/api/setups/groups/${id}`),
    enabled:  !!id,
  });
}
