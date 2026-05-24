// ============================================================
//  PAYMENTS SELECTORS
//  Pure functions. No imports from mock files. No side effects.
//
//  TODAY:   called with data fetched by usePayments() hook
//  FUTURE:  called via select: in useQuery — nothing changes here
// ============================================================

import type { Payment } from "@/lib/mock/payments";

export function getPaymentById(
  payments: Payment[],
  id: string
): Payment | undefined {
  return payments.find((p) => p.id === id);
}

export function getPaymentsByInvoice(
  payments: Payment[],
  invoiceId: string
): Payment[] {
  return payments.filter((p) => p.invoice_id === invoiceId);
}

export function getTotalPaidForInvoice(
  payments: Payment[],
  invoiceId: string
): number {
  return getPaymentsByInvoice(payments, invoiceId).reduce(
    (sum, p) => sum + p.amount,
    0
  );
}