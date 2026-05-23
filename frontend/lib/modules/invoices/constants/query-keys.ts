// ─────────────────────────────────────────────────────────
//  INVOICE QUERY KEYS
//
//  Invalidate after generating / updating an invoice:
//    await queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.invoices });
// ─────────────────────────────────────────────────────────

export const INVOICE_KEYS = {
  invoices: ["invoices"] as const,
} as const;