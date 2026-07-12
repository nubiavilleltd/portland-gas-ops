"use client";

import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
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
  const { isAuthenticated } = useAuthStore();

  return useQuery<ApprovalWorkflowListItem[]>({
    queryKey: workflowKeys.list(),
    queryFn:  () => get<ApprovalWorkflowListItem[]>("/api/workflow/"),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });
}

export function useWorkflow(id: string) {
  const { isAuthenticated } = useAuthStore();

  return useQuery<ApprovalWorkflow>({
    queryKey: workflowKeys.detail(id),
    queryFn:  () => get<ApprovalWorkflow>(`/api/workflow/${id}`),
    enabled:  isAuthenticated && !!id,
  });
}

export function useApproverGroups() {
  const { isAuthenticated } = useAuthStore();

  return useQuery<ApproverGroupListItem[]>({
    queryKey: workflowKeys.groups(),
    queryFn:  () => get<ApproverGroupListItem[]>("/api/workflow/groups/"),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });
}

export function useApproverGroup(id: string) {
  const { isAuthenticated } = useAuthStore();

  return useQuery<ApproverGroup>({
    queryKey: workflowKeys.group(id),
    queryFn:  () => get<ApproverGroup>(`/api/workflow/groups/${id}`),
    enabled:  isAuthenticated && !!id,
  });
}

export function useWorkflowAssignments() {
  const { isAuthenticated } = useAuthStore();

  return useQuery<WorkflowAssignment[]>({
    queryKey: workflowKeys.assignments(),
    queryFn:  () => get<WorkflowAssignment[]>("/api/workflow/assignments/"),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });
}

export interface WorkflowForTypeStep {
  step_number:   number;
  step_name:     string;
  assignee_type: string;
  group_id:      string | null;
  group_name:    string | null;
  group_members: { id: string; name: string; job_title: string | null; department: string | null; avatar_url: string | null }[];
}

export interface WorkflowForType {
  id:    string;
  name:  string;
  steps: WorkflowForTypeStep[];
}

export function useWorkflowForType(requestType: string) {
  const { isAuthenticated } = useAuthStore();

  return useQuery<WorkflowForType | null>({
    queryKey: ["workflow-for-type", requestType],
    queryFn:  () => get<WorkflowForType | null>(`/api/workflow/for-type/${requestType}`),
    enabled: isAuthenticated && Boolean(requestType),
    staleTime: 60 * 1000,
  });
}

export interface MyRequest {
  id: string;
  reference: string;
  request_type: string;
  request_id: string;
  title: string | null;
  status: string;
  department: string | null;
  approval_request_id: string | null;
  created_at: string;
  updated_at: string | null;
}

export function useMyRequests() {
  const { isAuthenticated } = useAuthStore();

  return useQuery<MyRequest[]>({
    queryKey: ["my-requests"],
    queryFn:  () => get<MyRequest[]>("/api/workflow/my-requests"),
    enabled: isAuthenticated,
  });
}

export interface MyApproval {
  approval_request_id: string;
  request_type:        string;
  request_id:          string;
  reference:           string | null;
  title:               string | null;
  department:          string | null;
  current_step_number: number;
  attempt_number:      number;
  submitted_at:        string;
}

export function useMyApprovals() {
  const { isAuthenticated } = useAuthStore();

  return useQuery<MyApproval[]>({
    queryKey: ["my-approvals"],
    queryFn:  () => get<MyApproval[]>("/api/workflow/my-approvals"),
    enabled: isAuthenticated,
  });
}

export interface AuditEntry {
  id:          string;
  action:      string;
  actor_name:  string | null;
  actor_role:  string | null;
  step_number: number | null;
  comment:     string | null;
  acted_at:    string;
}

export interface RequesterPick {
  employee_id: string;
  name:        string;
  job_title:   string | null;
  department:  string | null;
}

/**
 * Fetches the requester_pick assignments from the previous approval attempt.
 * Used to pre-fill the Approvers section when resubmitting a returned request.
 * Only enabled when requestId is provided (i.e. edit/resubmit mode).
 */
export function useRequesterPicks(requestType: string, requestId: string | undefined) {
  const { isAuthenticated } = useAuthStore();

  return useQuery<Record<string, RequesterPick>>({
    queryKey: ["requester-picks", requestType, requestId],
    queryFn:  () => get<Record<string, RequesterPick>>(`/api/workflow/picks/${requestType}/${requestId}`),
    enabled:  isAuthenticated && !!requestId,
    staleTime: 30 * 1000,
  });
}

export function useAuditTrail(requestType: string, requestId: string) {
  const { isAuthenticated } = useAuthStore();

  return useQuery<AuditEntry[]>({
    queryKey: ["audit-trail", requestType, requestId],
    queryFn:  () => get<AuditEntry[]>(`/api/workflow/audit/${requestType}/${requestId}`),
    enabled:  isAuthenticated && !!requestId,
    staleTime: 10 * 1000,
  });
}
