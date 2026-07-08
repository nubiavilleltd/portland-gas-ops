// ============================================================
//  PAYMENTS SELECTORS
//  Pure functions. No imports from mock files. No side effects.
//
//  TODAY:   called with data fetched by usePayments() hook
//  FUTURE:  called via select: in useQuery — nothing changes here
// ============================================================

import { Payment } from "../types/payments.types";


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
  return payments.filter((p) => p.invoiceId === invoiceId);
}

 
export function getPaymentSummary(
  payments: Payment[],
  invoiceId: string | undefined
): { amountPaid: number; count: number } {
  if (!invoiceId) return { amountPaid: 0, count: 0 };
  const related = getPaymentsByInvoice(payments, invoiceId);
  return {
    amountPaid: related.reduce((sum, p) => sum + p.amount, 0),
    count:      related.length,
  };
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