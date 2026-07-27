"use client";

import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import type { ProcurementRequest, ProcurementListItem, ProcurementStatus, PurchaseOrder } from "@/types";

export const procurementKeys = {
  all:     ["procurement"] as const,
  list:    (status?: ProcurementStatus) => ["procurement", "list", status ?? "all"] as const,
  detail:  (id: string)   => ["procurement", "detail", id] as const,
  pos:     ["procurement", "purchase-orders"] as const,
  po:      (id: string)   => ["procurement", "purchase-orders", id] as const,
};

export function useProcurementList(status?: ProcurementStatus) {
  return useQuery<ProcurementListItem[]>({
    queryKey: procurementKeys.list(status),
    queryFn:  () => get<ProcurementListItem[]>("/api/procurement", status ? { status } : {}),
    staleTime: 30 * 1000,
  });
}

export function useProcurement(id: string, options?: { enabled?: boolean }) {
  return useQuery<ProcurementRequest>({
    queryKey: procurementKeys.detail(id),
    queryFn:  () => get<ProcurementRequest>(`/api/procurement/${id}`),
    enabled:  !!id && (options?.enabled ?? true),
  });
}

export function useProcurementByVendor(vendorId: string) {
  return useQuery<ProcurementListItem[]>({
    queryKey: [...procurementKeys.list(), "vendor", vendorId],
    queryFn:  () => get<ProcurementListItem[]>("/api/procurement", { vendor_id: vendorId }),
    enabled:  !!vendorId,
  });
}

export function usePurchaseOrders(requestId?: string) {
  return useQuery<PurchaseOrder[]>({
    queryKey: requestId
      ? [...procurementKeys.pos, "request", requestId]
      : procurementKeys.pos,
    queryFn: () =>
      get<PurchaseOrder[]>("/api/procurement/purchase-orders", requestId ? { request_id: requestId } : {}),
  });
}

export function usePurchaseOrder(poId: string) {
  return useQuery<PurchaseOrder>({
    queryKey: procurementKeys.po(poId),
    queryFn:  () => get<PurchaseOrder>(`/api/procurement/purchase-orders/${poId}`),
    enabled:  !!poId,
  });
}
