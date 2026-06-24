"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, patch, del, postForm } from "@/lib/api";
import type { Vendor } from "@/types";

const KEYS = {
  all:    ["vendors"] as const,
  list:   (search?: string) => ["vendors", "list", search ?? ""] as const,
  detail: (id: string)      => ["vendors", "detail", id] as const,
};

export function useVendors(search?: string) {
  return useQuery<Vendor[]>({
    queryKey: KEYS.list(search),
    queryFn:  () => get<Vendor[]>("/api/vendors/", search ? { search } : undefined),
    staleTime: 5 * 60 * 1000,
  });
}

export function useVendor(id: string) {
  return useQuery<Vendor>({
    queryKey: KEYS.detail(id),
    queryFn:  () => get<Vendor>(`/api/vendors/${id}`),
    enabled:  !!id,
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Vendor> & { name: string; category: string }) =>
      post<Vendor>("/api/vendors/", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useUpdateVendor(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Vendor>) =>
      patch<Vendor>(`/api/vendors/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del<void>(`/api/vendors/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useDeactivateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => patch<Vendor>(`/api/vendors/${id}/deactivate`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useReactivateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => patch<Vendor>(`/api/vendors/${id}/reactivate`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.all }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.all }),
  });
}
