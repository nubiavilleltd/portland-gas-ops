// ─────────────────────────────────────────────────────────
//  INVOICE ROUTES
//

export const INVOICE_ROUTES = {
  list:     ()           => "/invoices",
  new:      ()           => "/invoices/new",
  detail:   (invoiceId: string) => `/invoices/${invoiceId}`,
  edit:     (invoiceId: string) => `/invoices/${invoiceId}/edit`,

  // Payments nested under invoice
  payments: (invoiceId: string) => `/invoices/${invoiceId}/payments`,
} as const;