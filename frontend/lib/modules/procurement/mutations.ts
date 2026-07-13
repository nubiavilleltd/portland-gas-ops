"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { post, patch, postForm, del } from "@/lib/api";
import type {
  ProcurementRequest,
  ProcurementUpdateInput,
  IssuePOInput,
  PurchaseOrder,
} from "@/types";
import { procurementKeys } from "./queries";

export function useCreateProcurement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      postForm<ProcurementRequest>("/api/procurement", formData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: procurementKeys.all }),
  });
}

export function useUpdateProcurement(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProcurementUpdateInput) =>
      patch<ProcurementRequest>(`/api/procurement/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: procurementKeys.all }),
  });
}

export function useSubmitProcurement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      post<ProcurementRequest>(`/api/procurement/${id}/submit`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: procurementKeys.all }),
  });
}

export function useApproveProcurement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      post<ProcurementRequest>(`/api/procurement/${id}/approve`, { comment }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: procurementKeys.all }),
  });
}

export function useRejectProcurement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      post<ProcurementRequest>(`/api/procurement/${id}/reject`, { comment }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: procurementKeys.all }),
  });
}

export function useReturnProcurement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      post<ProcurementRequest>(`/api/procurement/${id}/return`, { comment }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: procurementKeys.all }),
  });
}

export function useIssuePO() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: IssuePOInput }) =>
      post<PurchaseOrder>(`/api/procurement/${id}/issue-po`, data ?? {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: procurementKeys.all }),
  });
}

export function useApproveAndIssuePO() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      post<ProcurementRequest>(`/api/procurement/${id}/approve-and-issue-po`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procurementKeys.all });
      queryClient.invalidateQueries({ queryKey: ["my-approvals"] });
    },
  });
}

export function useConfirmDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      post<ProcurementRequest>(`/api/procurement/${id}/confirm-delivery`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procurementKeys.all });
      queryClient.invalidateQueries({ queryKey: ["my-approvals"] });
    },
  });
}

export function useRemoveProcurementAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      del<ProcurementRequest>(`/api/procurement/${id}/attachment`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: procurementKeys.all }),
  });
}

export function useUploadProcurementAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const fd = new FormData();
      fd.append("attachment", file);
      return postForm<ProcurementRequest>(`/api/procurement/${id}/attachment`, fd);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: procurementKeys.all }),
  });
}

export function useRegeneratePOPDF() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, poId }: { requestId: string; poId: string }) =>
      post<ProcurementRequest>(`/api/procurement/${requestId}/purchase-orders/${poId}/regenerate-pdf`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: procurementKeys.all }),
  });
}

export function useUpdatePOStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ poId, status }: { poId: string; status: "delivered" | "cancelled" }) =>
      patch<PurchaseOrder>(`/api/procurement/purchase-orders/${poId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procurementKeys.all });
    },
  });
}
