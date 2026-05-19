// import { invoices } from "@/lib/mock/invoices";

import { invoices } from "../mock/invoices.mock";

export function getInvoiceById(invoiceId: string) {
  return invoices.find(inv => inv.id === invoiceId);
}