"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, patch, del } from "@/lib/api";
import type { Vendor } from "@/types";

export function useVendors(search?: string) {
  return useQuery<Vendor[]>({
    queryKey: ["vendors", search ?? ""],
    queryFn: () =>
      get<Vendor[]>("/api/vendors/", search ? { search } : undefined),
    staleTime: 5 * 60 * 1000,
  });
}

export function useVendor(id: string) {
  return useQuery<Vendor>({
    queryKey: ["vendors", id],
    queryFn: () => get<Vendor>(`/api/vendors/${id}`),
    enabled: !!id,
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Vendor> & { name: string; category: string }) =>
      post<Vendor>("/api/vendors/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
}

export function useUpdateVendor(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Vendor>) => patch<Vendor>(`/api/vendors/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del<void>(`/api/vendors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
}
