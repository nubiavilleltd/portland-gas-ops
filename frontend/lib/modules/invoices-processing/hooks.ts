"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import invoicesApi from "./api";
import { InvoiceCreatePayload, ListInvoicesParams, MarkPaidPayload, CancelInvoicePayload } from "./types";

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

// ── Settlement (final workflow step) ────────────────────────────────────────
// Both actions are terminal and both close out the workflow, so they
// invalidate the workflow queries too — the request must drop off the
// approver's "my approvals" list immediately.

function useSettlementMutation<TPayload>(
  mutationFn: (vars: { id: string; payload: TPayload }) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["my-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["audit-trail"] });
    },
  });
}

export function useMarkInvoicePaid() {
  return useSettlementMutation<MarkPaidPayload>(({ id, payload }) =>
    invoicesApi.markPaid(id, payload),
  );
}

export function useCancelInvoice() {
  return useSettlementMutation<CancelInvoicePayload>(({ id, payload }) =>
    invoicesApi.cancel(id, payload),
  );
}
