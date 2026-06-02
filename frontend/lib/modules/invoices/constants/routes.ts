// ─────────────────────────────────────────────────────────
//  INVOICE ROUTES
//
//  Usage (inside invoices module):
//    import { INVOICE_ROUTES } from "../constants/routes";
//
//  Usage (from outside / cross-domain):
//    import { INVOICE_ROUTES } from "@/lib/routes";
// ─────────────────────────────────────────────────────────

export const INVOICE_ROUTES = {
  list:     ()           => "/invoices",
  new:      ()           => "/invoices/new",
  detail:   (id: string) => `/invoices/${id}`,
  edit:     (id: string) => `/invoices/${id}/edit`,

  // Payments nested under invoice
  payments: (id: string) => `/invoices/${id}/payments`,
} as const;