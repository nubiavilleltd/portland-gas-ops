
import { invoicesApi } from "../api/invoices.api";
import { adaptInvoice, adaptInvoiceList } from "../adapters/invoice.adapter";
import { getErrorMessage } from "@/lib/api/error";
import type { Invoice, CreateInvoiceInput } from "../types/invoice.types";

export class InvoicesService {
  static async getInvoices(): Promise<Invoice[]> {
    const raw = await invoicesApi.list({ page_size: 200 });
    return adaptInvoiceList(raw);
  }

  static async getInvoiceById(id: string): Promise<Invoice | undefined> {
    try {
      const raw = await invoicesApi.get(id);
      return adaptInvoice(raw);
    } catch { return undefined; }
  }

  static async getInvoiceByOrderId(orderId: string): Promise<Invoice | undefined> {
    try {
      const raw = await invoicesApi.getByOrder(orderId);
      return adaptInvoice(raw);
    } catch { return undefined; }
  }

  static async createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
    try {
      const raw = await invoicesApi.create({
        order_id:     input.order_id,
        issued_date: input.issued_date,
        due_date:     input.due_date,
        notes:       input.notes,
      });
      return adaptInvoice(raw);
      // Backend handles: linking invoice to order, setting order.payment_status=unpaid
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to create invoice"));
    }
  }

  static async voidInvoice(orderId: string): Promise<Invoice | undefined> {
    // orderId is actually order_no in frontend — fetch invoice by order then void it
    try {
      const invoice = await InvoicesService.getInvoiceByOrderId(orderId);
      if (!invoice) return undefined;
      const raw = await invoicesApi.void(invoice.id);
      return adaptInvoice(raw);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to void invoice"));
    }
  }

  // These are now no-ops — backend handles status updates automatically via payment cascade
  static async markPaid(_id: string): Promise<Invoice> {
    throw new Error("Use payment recording to update invoice status");
  }

  static async markPartiallyPaid(_id: string): Promise<Invoice> {
    throw new Error("Use payment recording to update invoice status");
  }
}