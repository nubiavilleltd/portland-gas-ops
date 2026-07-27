// lib/modules/payments/guards/payments.guards.ts

import type { Invoice } from "@/lib/modules/invoices/types/invoice.types";

export function canRecordPayment(invoice: Invoice): boolean {
  return invoice.status !== "paid";
}