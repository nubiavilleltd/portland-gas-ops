// ─────────────────────────────────────────────────────────
//  PAYMENT QUERY KEYS

// lib/modules/payments/constants/query-keys.ts

export const PAYMENT_KEYS = {
  all: ["payments"] as const,

  lists: () => [...PAYMENT_KEYS.all, "list"] as const,

  list: (filters?: string) =>
    [...PAYMENT_KEYS.lists(), { filters }] as const,

  details: () => [...PAYMENT_KEYS.all, "detail"] as const,

  detail: (id: string) =>
    [...PAYMENT_KEYS.details(), id] as const,

  byInvoice: (invoiceId: string) =>
    [...PAYMENT_KEYS.all, "invoice", invoiceId] as const,

} as const;