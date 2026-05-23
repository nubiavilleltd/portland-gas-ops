// ─────────────────────────────────────────────────────────
//  PAYMENT QUERY KEYS
//
//  Invalidate after recording a payment:
//    await queryClient.invalidateQueries({ queryKey: PAYMENT_KEYS.payments });
//
//  Note: recording a payment also affects invoices, so invalidate both:
//    await queryClient.invalidateQueries({ queryKey: PAYMENT_KEYS.payments });
//    await queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.invoices });
// ─────────────────────────────────────────────────────────

export const PAYMENT_KEYS = {
  payments: ["payments"] as const,
} as const;