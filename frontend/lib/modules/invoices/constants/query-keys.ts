// ─────────────────────────────────────────────────────────
//  INVOICE QUERY KEYS
//
//  Invalidate after generating / updating an invoice:
//    await queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.invoices });
// ─────────────────────────────────────────────────────────

export const INVOICE_KEYS = {
  all: ["invoices"] as const,
  lists: () => [...INVOICE_KEYS.all, "list"] as const,
  list: (filters?: string) => [...INVOICE_KEYS.lists(), { filters }] as const,
  details: () => [...INVOICE_KEYS.all, "detail"] as const,
  detail: (id: string) => [...INVOICE_KEYS.details(), id] as const,
} as const;