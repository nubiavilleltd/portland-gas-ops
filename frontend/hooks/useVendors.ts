"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorStore } from "@/lib/mockStore";
// import { get, post, patch, del } from "@/lib/api";
import type { Vendor } from "@/types";

// ── MOCK implementations ───────────────────────────────────────────────────────

export function useVendors(_search?: string) {
  return useQuery<Vendor[]>({
    queryKey: ["vendors", _search ?? ""],
    queryFn: () => Promise.resolve(vendorStore.getAll()),
    staleTime: Infinity,
  });
}

export function useVendor(id: string) {
  return useQuery<Vendor>({
    queryKey: ["vendors", id],
    queryFn: () => {
      const v = vendorStore.getById(id);
      if (!v) throw new Error("Vendor not found");
      return Promise.resolve(v);
    },
    enabled: !!id,
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Vendor> & { name: string; category: string }) => {
      const vendor = vendorStore.add({
        name: data.name,
        category: data.category as Vendor["category"],
        contact_person: data.contact_person ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        address: data.address ?? null,
        bank_name: data.bank_name ?? null,
        account_name: data.account_name ?? null,
        account_number: data.account_number ?? null,
        status: "active",
        added_by: null,
      });
      return Promise.resolve(vendor);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendors"] }),
  });
}

export function useUpdateVendor(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Vendor>) => {
      const updated = vendorStore.update(id, data);
      return Promise.resolve(updated);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendors"] }),
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      vendorStore.remove(id);
      return Promise.resolve();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendors"] }),
  });
}

// ── ORIGINAL (uncomment to re-enable backend) ──────────────────────────────────
// export function useVendors(search?: string) {
//   return useQuery<Vendor[]>({
//     queryKey: ["vendors", search ?? ""],
//     queryFn: () => get<Vendor[]>("/api/vendors/", search ? { search } : undefined),
//     staleTime: 5 * 60 * 1000,
//   });
// }
// export function useVendor(id: string) {
//   return useQuery<Vendor>({
//     queryKey: ["vendors", id],
//     queryFn: () => get<Vendor>(`/api/vendors/${id}`),
//     enabled: !!id,
//   });
// }
// export function useCreateVendor() {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (data: Partial<Vendor> & { name: string; category: string }) =>
//       post<Vendor>("/api/vendors/", data),
//     onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendors"] }),
//   });
// }
// export function useUpdateVendor(id: string) {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (data: Partial<Vendor>) => patch<Vendor>(`/api/vendors/${id}`, data),
//     onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendors"] }),
//   });
// }
// export function useDeleteVendor() {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (id: string) => del<void>(`/api/vendors/${id}`),
//     onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendors"] }),
//   });
// }
