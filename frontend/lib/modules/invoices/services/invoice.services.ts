
import { invoicesApi } from "../api/invoices.api";
import { adaptInvoice, adaptInvoiceList } from "../adapters/invoice.adapter";
import type { Invoice, CreateInvoiceInput } from "../types/invoice.types";
import { getErrorMessage } from "@/lib/errors";
import { INVOICE_ERROR_MESSAGES } from "../errors";

export class InvoicesService {
  static async getInvoices(): Promise<Invoice[]> {
    try {
      
      const raw = await invoicesApi.list({ page_size: 200 });
      return adaptInvoiceList(raw);
    } catch (err) {
      throw new Error(getErrorMessage(err, INVOICE_ERROR_MESSAGES, "Failed to fetch invoices"));
    }
  }

  static async getInvoice(id: string): Promise<Invoice | undefined> {
    try {
      const raw = await invoicesApi.get(id);
      return adaptInvoice(raw);
    } catch(err) { 
      throw new Error(getErrorMessage(err, INVOICE_ERROR_MESSAGES, "Failed to fetch invoice"));
    }
  }

  static async getInvoiceByOrderId(orderId: string): Promise<Invoice | undefined> {
    try {
      const raw = await invoicesApi.getByOrder(orderId);
      return adaptInvoice(raw);
    } catch(err) {
      throw new Error(getErrorMessage(err, INVOICE_ERROR_MESSAGES, "Failed to fetch invoice"));
    }
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
      throw new Error(getErrorMessage(err, INVOICE_ERROR_MESSAGES, "Failed to create invoice"));
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
      throw new Error(getErrorMessage(err, INVOICE_ERROR_MESSAGES, "Failed to void invoice"));
    }
  }

}