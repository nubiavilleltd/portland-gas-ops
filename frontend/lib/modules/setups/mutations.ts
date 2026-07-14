"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { post, patch, del } from "@/lib/api";
import { setupsKeys } from "./queries";

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; group_type?: string }) =>
      post("/api/setups/groups", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: setupsKeys.groups() }),
  });
}

export function useUpdateGroup(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; description?: string; group_type?: string; is_active?: boolean }) =>
      patch(`/api/setups/groups/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: setupsKeys.groups() });
      qc.invalidateQueries({ queryKey: setupsKeys.group(id) });
    },
  });
}

export function useAddGroupMember(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (employeeId: string) =>
      post(`/api/setups/groups/${groupId}/members`, { employee_id: employeeId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: setupsKeys.group(groupId) }),
  });
}

export function useRemoveGroupMember(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => del(`/api/setups/groups/${groupId}/members/${memberId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: setupsKeys.group(groupId) }),
  });
}
