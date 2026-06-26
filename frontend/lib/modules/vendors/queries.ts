"use client";

import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import type { Vendor } from "@/types";

export const vendorKeys = {
  all:    ["vendors"] as const,
  list:   (search?: string, includeInactive?: boolean) =>
            ["vendors", "list", search ?? "", includeInactive ?? false] as const,
  detail: (id: string) => ["vendors", "detail", id] as const,
};

export function useVendors(search?: string, includeInactive?: boolean) {
  return useQuery<Vendor[]>({
    queryKey: vendorKeys.list(search, includeInactive),
    queryFn:  () => get<Vendor[]>("/api/vendors/", {
      ...(search ? { search } : {}),
      ...(includeInactive ? { include_inactive: true } : {}),
    }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useVendor(id: string) {
  return useQuery<Vendor>({
    queryKey: vendorKeys.detail(id),
    queryFn:  () => get<Vendor>(`/api/vendors/${id}`),
    enabled:  !!id,
  });
}
