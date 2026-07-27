"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { post, patch, del, postForm } from "@/lib/api";
import type { Vendor } from "@/types";
import { vendorKeys } from "./queries";

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Vendor> & { name: string; category: string }) =>
      post<Vendor>("/api/vendors", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.all }),
  });
}

export function useUpdateVendor(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Vendor>) => patch<Vendor>(`/api/vendors/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.all }),
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del<void>(`/api/vendors/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.all }),
  });
}

export function useDeactivateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => patch<Vendor>(`/api/vendors/${id}/deactivate`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.all }),
  });
}

export function useReactivateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => patch<Vendor>(`/api/vendors/${id}/reactivate`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.all }),
  });
}

export function useUploadVendorLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      return postForm<Vendor>(`/api/vendors/${id}/logo`, formData);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vendorKeys.all }),
  });
}
