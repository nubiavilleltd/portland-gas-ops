"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { procurementStore } from "@/lib/mockStore";
// import { get, patch, del, postForm } from "@/lib/api";
import type {
  ProcurementRequest,
  ProcurementListItem,
  ProcurementCreateInput,
  ProcurementStatus,
  PaymentStatus,
} from "@/types";

// ── MOCK implementations ───────────────────────────────────────────────────────

export function useProcurementList(status?: ProcurementStatus) {
  return useQuery<ProcurementListItem[]>({
    queryKey: ["procurement", "list", status ?? "all"],
    queryFn: () => {
      let list = procurementStore.getList();
      if (status) list = list.filter((p) => p.status === status);
      return Promise.resolve(list);
    },
    staleTime: Infinity,
  });
}

export function useProcurement(id: string) {
  return useQuery<ProcurementRequest>({
    queryKey: ["procurement", id],
    queryFn: () => {
      const p = procurementStore.getById(id);
      if (!p) throw new Error("Procurement request not found");
      return Promise.resolve(p);
    },
    enabled: !!id,
  });
}

export function useCreateProcurement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      data,
    }: {
      data: ProcurementCreateInput;
      file?: File | null;
    }) => Promise.resolve(procurementStore.add(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procurement", "list"] });
    },
  });
}

export function useUpdateProcurementStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ status, paymentTerms }: { status: ProcurementStatus; paymentTerms?: string | null }) => {
      procurementStore.updateStatus(id, status, paymentTerms);
      return Promise.resolve(procurementStore.getById(id)!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procurement"] });
    },
  });
}

export function useCancelProcurement(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      procurementStore.remove(id);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procurement"] });
    },
  });
}

export function useProcurementByVendor(vendorId: string) {
  return useQuery<ProcurementRequest[]>({
    queryKey: ["procurement", "vendor", vendorId],
    queryFn: () => Promise.resolve(procurementStore.getByVendor(vendorId)),
    enabled: !!vendorId,
    staleTime: Infinity,
  });
}

export function useUpdatePaymentStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentStatus: PaymentStatus) => {
      procurementStore.updatePaymentStatus(id, paymentStatus);
      return Promise.resolve(procurementStore.getById(id)!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procurement"] });
    },
  });
}

// ── ORIGINAL (uncomment to re-enable backend) ──────────────────────────────────
// export function useProcurementList(status?: ProcurementStatus) {
//   return useQuery<ProcurementListItem[]>({
//     queryKey: ["procurement", "list", status ?? "all"],
//     queryFn: () =>
//       get<ProcurementListItem[]>("/api/procurement/", status ? { status } : undefined),
//     staleTime: 30 * 1000,
//   });
// }
// export function useProcurement(id: string) {
//   return useQuery<ProcurementRequest>({
//     queryKey: ["procurement", id],
//     queryFn: () => get<ProcurementRequest>(`/api/procurement/${id}`),
//     enabled: !!id,
//   });
// }
// export function useCreateProcurement() {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: ({
//       data,
//       file,
//     }: {
//       data: ProcurementCreateInput;
//       file?: File | null;
//     }) => {
//       const formData = new FormData();
//       formData.append("data", JSON.stringify(data));
//       if (file) formData.append("attachment", file);
//       return postForm<ProcurementRequest>("/api/procurement/", formData);
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["procurement", "list"] });
//     },
//   });
// }
// export function useUpdateProcurementStatus(id: string) {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (status: ProcurementStatus) =>
//       patch<ProcurementRequest>(`/api/procurement/${id}/status`, { status }),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["procurement"] });
//     },
//   });
// }
// export function useCancelProcurement(id: string) {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: () => del(`/api/procurement/${id}`),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["procurement"] });
//     },
//   });
// }
