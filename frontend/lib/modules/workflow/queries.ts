"use client";

import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import type {
  ApprovalWorkflow,
  ApprovalWorkflowListItem,
  ApproverGroup,
  ApproverGroupListItem,
  WorkflowAssignment,
} from "@/types/workflow";

export const workflowKeys = {
  all:         ["workflows"] as const,
  list:        () => ["workflows", "list"] as const,
  detail:      (id: string) => ["workflows", "detail", id] as const,
  groups:      () => ["workflows", "groups"] as const,
  group:       (id: string) => ["workflows", "groups", id] as const,
  assignments: () => ["workflows", "assignments"] as const,
};

export function useWorkflows() {
  return useQuery<ApprovalWorkflowListItem[]>({
    queryKey: workflowKeys.list(),
    queryFn:  () => get<ApprovalWorkflowListItem[]>("/api/workflow/"),
    staleTime: 30 * 1000,
  });
}

export function useWorkflow(id: string) {
  return useQuery<ApprovalWorkflow>({
    queryKey: workflowKeys.detail(id),
    queryFn:  () => get<ApprovalWorkflow>(`/api/workflow/${id}`),
    enabled:  !!id,
  });
}

export function useApproverGroups() {
  return useQuery<ApproverGroupListItem[]>({
    queryKey: workflowKeys.groups(),
    queryFn:  () => get<ApproverGroupListItem[]>("/api/workflow/groups/"),
    staleTime: 30 * 1000,
  });
}

export function useApproverGroup(id: string) {
  return useQuery<ApproverGroup>({
    queryKey: workflowKeys.group(id),
    queryFn:  () => get<ApproverGroup>(`/api/workflow/groups/${id}`),
    enabled:  !!id,
  });
}

export function useWorkflowAssignments() {
  return useQuery<WorkflowAssignment[]>({
    queryKey: workflowKeys.assignments(),
    queryFn:  () => get<WorkflowAssignment[]>("/api/workflow/assignments/"),
    staleTime: 30 * 1000,
  });
}
