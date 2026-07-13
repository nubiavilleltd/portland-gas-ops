"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { post, put, patch, del } from "@/lib/api";
import { workflowKeys } from "./queries";

// ── Workflows ──────────────────────────────────────────────────────────────────

export function useCreateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; reset_on_return?: boolean }) =>
      post("/api/workflow", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: workflowKeys.list() }),
  });
}

export function useUpdateWorkflow(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; description?: string; is_active?: boolean; reset_on_return?: boolean }) =>
      patch(`/api/workflow/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workflowKeys.list() });
      qc.invalidateQueries({ queryKey: workflowKeys.detail(id) });
    },
  });
}

export function useDeleteWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del(`/api/workflow/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: workflowKeys.list() }),
  });
}

// ── Steps ─────────────────────────────────────────────────────────────────────

export function useAddStep(workflowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      step_name: string;
      assignee_type: string;
      role?: string;
      employee_id?: string;
      group_id?: string;
      can_approve?: boolean;
      can_reject?: boolean;
      can_return?: boolean;
    }) => post(`/api/workflow/${workflowId}/steps`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: workflowKeys.detail(workflowId) }),
  });
}

export function useUpdateStep(workflowId: string, stepId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      step_name?: string;
      assignee_type?: string;
      role?: string;
      employee_id?: string;
      group_id?: string;
      can_approve?: boolean;
      can_reject?: boolean;
      can_return?: boolean;
    }) => patch(`/api/workflow/${workflowId}/steps/${stepId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: workflowKeys.detail(workflowId) }),
  });
}

export function useDeleteStep(workflowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (stepId: string) => del(`/api/workflow/${workflowId}/steps/${stepId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: workflowKeys.detail(workflowId) }),
  });
}

export function useReorderSteps(workflowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (stepIds: string[]) =>
      put(`/api/workflow/${workflowId}/steps/reorder`, { step_ids: stepIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: workflowKeys.detail(workflowId) }),
  });
}

// ── Approver Groups ────────────────────────────────────────────────────────────

export function useCreateApproverGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      post("/api/workflow/groups", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: workflowKeys.groups() }),
  });
}

export function useUpdateApproverGroup(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; description?: string; is_active?: boolean }) =>
      patch(`/api/workflow/groups/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workflowKeys.groups() });
      qc.invalidateQueries({ queryKey: workflowKeys.group(id) });
    },
  });
}

export function useAddGroupMember(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (employeeId: string) =>
      post(`/api/workflow/groups/${groupId}/members`, { employee_id: employeeId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: workflowKeys.group(groupId) }),
  });
}

export function useRemoveGroupMember(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => del(`/api/workflow/groups/${groupId}/members/${memberId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: workflowKeys.group(groupId) }),
  });
}

// ── Workflow Assignments ───────────────────────────────────────────────────────

export function useSetWorkflowAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { request_type: string; workflow_id: string }) =>
      put("/api/workflow/assignments", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: workflowKeys.assignments() }),
  });
}

// ── Approval actions (used from request detail pages) ─────────────────────────

type ApprovalAction = { approvalRequestId: string; comment?: string };

function invalidateAfterAction(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["my-approvals"] });
  qc.invalidateQueries({ queryKey: ["my-requests"] });
  qc.invalidateQueries({ queryKey: ["audit-trail"] });
  // Invalidate all module queries so detail pages reflect the new status immediately
  qc.invalidateQueries({ queryKey: ["procurement"] });
}

export function useWorkflowApprove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ approvalRequestId, comment }: ApprovalAction) =>
      post(`/api/workflow/requests/${approvalRequestId}/approve`, { comment }),
    onSuccess: () => invalidateAfterAction(qc),
  });
}

export function useWorkflowReject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ approvalRequestId, comment }: ApprovalAction) =>
      post(`/api/workflow/requests/${approvalRequestId}/reject`, { comment }),
    onSuccess: () => invalidateAfterAction(qc),
  });
}

export function useWorkflowReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ approvalRequestId, comment }: ApprovalAction) =>
      post(`/api/workflow/requests/${approvalRequestId}/return`, { comment }),
    onSuccess: () => invalidateAfterAction(qc),
  });
}
