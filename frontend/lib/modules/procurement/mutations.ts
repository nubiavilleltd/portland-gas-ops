"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { post, patch } from "@/lib/api";
import type {
  ProcurementRequest,
  ProcurementCreateInput,
  ProcurementUpdateInput,
  IssuePOInput,
  PurchaseOrder,
} from "@/types";
import { procurementKeys } from "./queries";

export function useCreateProcurement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProcurementCreateInput) =>
      post<ProcurementRequest>("/api/procurement/", data),
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

export function useUpdatePOStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ poId, status }: { poId: string; status: "delivered" | "cancelled" }) =>
      patch<PurchaseOrder>(`/api/procurement/purchase-orders/${poId}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: procurementKeys.all }),
  });
}
