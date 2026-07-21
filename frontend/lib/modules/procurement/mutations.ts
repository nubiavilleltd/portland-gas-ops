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
import { PROCUREMENT_ERRORS, resolveProcurementError } from "./errors";

export function useCreateProcurement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      try {
        return await postForm<ProcurementRequest>("/api/procurement", formData);
      } catch (err) {
        throw new Error(resolveProcurementError(err, PROCUREMENT_ERRORS.CREATE));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: procurementKeys.all }),
  });
}

export function useUpdateProcurement(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ProcurementUpdateInput) => {
      try {
        return await patch<ProcurementRequest>(`/api/procurement/${id}`, data);
      } catch (err) {
        throw new Error(resolveProcurementError(err, PROCUREMENT_ERRORS.UPDATE));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: procurementKeys.all }),
  });
}

export function useSubmitProcurement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        return await post<ProcurementRequest>(`/api/procurement/${id}/submit`);
      } catch (err) {
        throw new Error(resolveProcurementError(err, PROCUREMENT_ERRORS.SUBMIT));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: procurementKeys.all }),
  });
}

export function useApproveProcurement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment?: string }) => {
      try {
        return await post<ProcurementRequest>(`/api/procurement/${id}/approve`, { comment });
      } catch (err) {
        throw new Error(resolveProcurementError(err, PROCUREMENT_ERRORS.APPROVE));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: procurementKeys.all }),
  });
}

export function useRejectProcurement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment?: string }) => {
      try {
        return await post<ProcurementRequest>(`/api/procurement/${id}/reject`, { comment });
      } catch (err) {
        throw new Error(resolveProcurementError(err, PROCUREMENT_ERRORS.REJECT));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: procurementKeys.all }),
  });
}

export function useReturnProcurement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment?: string }) => {
      try {
        return await post<ProcurementRequest>(`/api/procurement/${id}/return`, { comment });
      } catch (err) {
        throw new Error(resolveProcurementError(err, PROCUREMENT_ERRORS.RETURN));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: procurementKeys.all }),
  });
}

export function useIssuePO() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data?: IssuePOInput }) => {
      try {
        return await post<PurchaseOrder>(`/api/procurement/${id}/issue-po`, data ?? {});
      } catch (err) {
        throw new Error(resolveProcurementError(err, PROCUREMENT_ERRORS.ISSUE_PO));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: procurementKeys.all }),
  });
}

export function useApproveAndIssuePO() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notes, comment }: { id: string; notes?: string; comment?: string }) => {
      try {
        return await post<ProcurementRequest>(`/api/procurement/${id}/approve-and-issue-po`, { notes, comment });
      } catch (err) {
        throw new Error(resolveProcurementError(err, PROCUREMENT_ERRORS.APPROVE));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procurementKeys.all });
      queryClient.invalidateQueries({ queryKey: ["my-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["audit-trail"] });
    },
  });
}

export function useConfirmDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment?: string }) => {
      try {
        return await post<ProcurementRequest>(`/api/procurement/${id}/confirm-delivery`, { comment });
      } catch (err) {
        throw new Error(resolveProcurementError(err, PROCUREMENT_ERRORS.CONFIRM_DELIVERY));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procurementKeys.all });
      queryClient.invalidateQueries({ queryKey: ["my-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["audit-trail"] });
    },
  });
}

export function useRemoveProcurementAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        return await del<ProcurementRequest>(`/api/procurement/${id}/attachment`);
      } catch (err) {
        throw new Error(resolveProcurementError(err, PROCUREMENT_ERRORS.REMOVE_ATTACH));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: procurementKeys.all }),
  });
}

export function useUploadProcurementAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      try {
        const fd = new FormData();
        fd.append("attachment", file);
        return await postForm<ProcurementRequest>(`/api/procurement/${id}/attachment`, fd);
      } catch (err) {
        throw new Error(resolveProcurementError(err, PROCUREMENT_ERRORS.UPLOAD));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: procurementKeys.all }),
  });
}

export function useRegeneratePOPDF() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, poId }: { requestId: string; poId: string }) => {
      try {
        return await post<ProcurementRequest>(`/api/procurement/${requestId}/purchase-orders/${poId}/regenerate-pdf`);
      } catch (err) {
        throw new Error(resolveProcurementError(err, PROCUREMENT_ERRORS.REGENERATE_PDF));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: procurementKeys.all }),
  });
}

export function useUpdatePOStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ poId, status }: { poId: string; status: "delivered" | "cancelled" }) => {
      try {
        return await patch<PurchaseOrder>(`/api/procurement/purchase-orders/${poId}/status`, { status });
      } catch (err) {
        throw new Error(resolveProcurementError(err, PROCUREMENT_ERRORS.UPDATE_PO_STATUS));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: procurementKeys.all }),
  });
}
