import { invoices } from "@/lib/mock/invoices";

export function getInvoiceById(invoiceId: string) {
  return invoices.find(inv => inv.id === invoiceId);
}