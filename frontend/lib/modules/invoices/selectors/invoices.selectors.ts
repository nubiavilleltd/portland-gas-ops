// // import { invoices } from "@/lib/mock/invoices";

// import { Invoice } from "../types/invoice.types";

// export function getInvoiceById(invoices:Invoice[], invoiceId: string) {
//   return invoices.find(inv => inv.id === invoiceId);
// }



// ============================================================
//  INVOICES SELECTORS
//  Pure functions. No imports from mock files. No side effects.
//
//  TODAY:   called with data fetched by useInvoices() hook
//  FUTURE:  called via select: in useQuery — nothing changes here
// ============================================================

import type { Invoice } from "@/lib/modules/invoices/types/invoice.types";

export function getInvoiceById(
  invoices: Invoice[],
  id: string
): Invoice | undefined {
  return invoices.find((inv) => inv.id === id);
}

export function getInvoiceByOrderId(
  invoices: Invoice[],
  orderId: string
): Invoice | undefined {
  return invoices.find((inv) => inv.order_id === orderId);
}

export function getUnpaidInvoices(invoices: Invoice[]): Invoice[] {
  return invoices.filter((inv) => inv.status === "unpaid");
}

export function getOverdueInvoices(invoices: Invoice[]): Invoice[] {
  const today = new Date().toISOString().slice(0, 10);
  return invoices.filter(
    (inv) => inv.status !== "paid" && inv.due_date < today
  );
}