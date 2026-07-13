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
  detail:   (invoiceNo: string) => `/invoices/${invoiceNo}`,
  edit:     (invoiceNo: string) => `/invoices/${invoiceNo}/edit`,

  // Payments nested under invoice
  payments: (invoiceNo: string) => `/invoices/${invoiceNo}/payments`,
} as const;