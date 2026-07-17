"use client";

import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import type { DepartmentListItem } from "@/types/setups";

export type { DepartmentListItem };

export interface GroupListItem {
  id: string;
  name: string;
  description: string | null;
  group_type: string;
  is_active: boolean;
  member_count: number;
  created_at: string;
}

export interface GroupMember {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_no: string;
  job_title: string | null;
  department: string | null;
}

export interface GroupDetail extends GroupListItem {
  members: GroupMember[];
}

export const setupsKeys = {
  departments:      () => ["setups", "departments"] as const,
  department:       (id: string) => ["setups", "departments", id] as const,
  groups:           () => ["setups", "groups"] as const,
  group:            (id: string) => ["setups", "groups", id] as const,
};

export function useDepartments(activeOnly = false) {
  return useQuery<DepartmentListItem[]>({
    queryKey: setupsKeys.departments(),
    queryFn:  () => get<DepartmentListItem[]>(`/api/setups/departments${activeOnly ? "?active_only=true" : ""}`),
    staleTime: 60 * 1000,
  });
}

export function useGroups() {
  return useQuery<GroupListItem[]>({
    queryKey: setupsKeys.groups(),
    queryFn:  () => get<GroupListItem[]>("/api/setups/groups"),
    staleTime: 30 * 1000,
  });
}

export function useGroup(id: string) {
  return useQuery<GroupDetail>({
    queryKey: setupsKeys.group(id),
    queryFn:  () => get<GroupDetail>(`/api/setups/groups/${id}`),
    enabled:  !!id,
  });
}
