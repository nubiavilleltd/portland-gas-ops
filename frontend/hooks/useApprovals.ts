"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import type { ApprovalRequest } from "@/types";

interface PendingApprovalsResponse {
  items: ApprovalRequest[];
  total: number;
}

export function useMyApprovals() {
  return useQuery<PendingApprovalsResponse>({
    queryKey: ["approvals", "mine"],
    queryFn: () => get<PendingApprovalsResponse>("/api/approvals/mine"),
    staleTime: 60 * 1000,
  });
}

export function useApproval(id: string) {
  return useQuery<ApprovalRequest>({
    queryKey: ["approvals", id],
    queryFn: () => get<ApprovalRequest>(`/api/approvals/${id}`),
    enabled: !!id,
  });
}

export function useApprovalActions(id: string) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const approve = useMutation({
    mutationFn: (comment?: string) =>
      post(`/api/approvals/${id}/approve`, { comment }),
    onSuccess: () => {
      toast.success("Updated successfully");
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
    },
  });

  const reject = useMutation({
    mutationFn: (comment?: string) =>
      post(`/api/approvals/${id}/reject`, { comment }),
    onSuccess: () => {
      toast.success("Updated successfully");
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
    },
  });

  const returnToSubmitter = useMutation({
    mutationFn: (comment?: string) =>
      post(`/api/approvals/${id}/return`, { comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
    },
  });

  return { approve, reject, returnToSubmitter };
}
