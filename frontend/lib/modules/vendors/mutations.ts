"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Vendor } from "@/types";
import { vendorKeys } from "./queries";
import { VENDOR_FALLBACKS, VENDOR_DOCUMENT_ERRORS, resolveVendorError } from "./errors";

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Vendor> & { name: string; category: string }) => {
      try {
        const { data: res } = await api.post<Vendor>("/api/vendors", data);
        return res;
      } catch (err) {
        throw new Error(resolveVendorError(err, VENDOR_FALLBACKS.CREATE_VENDOR));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.all }),
  });
}

export function useUpdateVendor(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Vendor>) => {
      try {
        const { data: res } = await api.patch<Vendor>(`/api/vendors/${id}`, data);
        return res;
      } catch (err) {
        throw new Error(resolveVendorError(err, VENDOR_FALLBACKS.UPDATE_VENDOR));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.all }),
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await api.delete(`/api/vendors/${id}`);
      } catch (err) {
        throw new Error(resolveVendorError(err, VENDOR_FALLBACKS.DELETE_VENDOR));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.all }),
  });
}

export function useDeactivateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const { data: res } = await api.patch<Vendor>(`/api/vendors/${id}/deactivate`, {});
        return res;
      } catch (err) {
        throw new Error(resolveVendorError(err, VENDOR_FALLBACKS.DEACTIVATE_VENDOR));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.all }),
  });
}

export function useReactivateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const { data: res } = await api.patch<Vendor>(`/api/vendors/${id}/reactivate`, {});
        return res;
      } catch (err) {
        throw new Error(resolveVendorError(err, VENDOR_FALLBACKS.REACTIVATE_VENDOR));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.all }),
  });
}

export function useUploadVendorLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const { data: res } = await api.post<Vendor>(`/api/vendors/${id}/logo`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return res;
      } catch (err) {
        throw new Error(resolveVendorError(err, VENDOR_FALLBACKS.UPLOAD_LOGO));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.all }),
  });
}

// ── Compliance Document Uploads ───────────────────────────────────────────────

export type VendorDocumentType = "cac" | "tin" | "vat";

const DOC_TYPE_FALLBACKS: Record<VendorDocumentType, string> = {
  cac: VENDOR_DOCUMENT_ERRORS.UPLOAD_CAC,
  tin: VENDOR_DOCUMENT_ERRORS.UPLOAD_TIN,
  vat: VENDOR_DOCUMENT_ERRORS.UPLOAD_VAT,
};

export function useUploadVendorDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, documentType, file }: { id: string; documentType: VendorDocumentType; file: File }) => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const { data: res } = await api.post<Vendor>(`/api/vendors/${id}/documents/${documentType}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return res;
      } catch (err) {
        throw new Error(resolveVendorError(err, DOC_TYPE_FALLBACKS[documentType]));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.all }),
  });
}

export function useDeleteVendorDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, documentType }: { id: string; documentType: VendorDocumentType }) => {
      try {
        const { data: res } = await api.delete<Vendor>(`/api/vendors/${id}/documents/${documentType}`);
        return res;
      } catch (err) {
        throw new Error(resolveVendorError(err, VENDOR_DOCUMENT_ERRORS.DELETE_DOCUMENT));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.all }),
  });
}
