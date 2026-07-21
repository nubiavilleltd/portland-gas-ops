"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import invoicesApi from "./api";
import { InvoiceCreatePayload, ListInvoicesParams } from "./types";

const QUERY_KEYS = {
  all: ["invoices-processing"],
  list: (params?: ListInvoicesParams) => [...QUERY_KEYS.all, "list", params],
  detail: (id: string) => [...QUERY_KEYS.all, "detail", id],
  poOptions: ["invoices-processing", "po-options"],
};

export function useInvoices(params: ListInvoicesParams = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.list(params),
    queryFn: () => invoicesApi.list(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useInvoice(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: () => invoicesApi.get(id),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePoOptions() {
  return useQuery({
    queryKey: QUERY_KEYS.poOptions,
    queryFn: () => invoicesApi.poOptions(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useVendorOptions() {
  return useQuery({
    queryKey: ["invoices-processing", "vendor-options"],
    queryFn: () => invoicesApi.vendorOptions(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InvoiceCreatePayload) => invoicesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
}
