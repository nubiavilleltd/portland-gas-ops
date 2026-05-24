// ============================================================
//  INVOICES SERVICE
//  Single source of truth for all invoice operations.
//  Backed by mock data. Swap for fetch() calls when backend is ready.
// ============================================================

import { CreateInvoiceInput, Invoice } from "@/lib/modules/invoices/types/invoice.types";
import { invoices } from "@/lib/modules/invoices/mock/invoices.mock";
import { OrdersService } from "@/lib/services/api/orders.service";



export class InvoicesService {
  // ── READ ────────────────────────────────────────────────

  static async getInvoices(): Promise<Invoice[]> {
    // FUTURE: return fetch('/api/invoices').then(r => r.json());
    return Promise.resolve([...invoices]);
  }

  static async getInvoiceById(id: string): Promise<Invoice | undefined> {
    return Promise.resolve(invoices.find((inv) => inv.id === id));
  }
//   static async getInvoiceById(id: string): Promise<Invoice | undefined> {
//     return Promise.resolve(invoices.find((inv) => inv.id === id));
//   }

  static async getInvoiceByOrderId(orderId: string): Promise<Invoice | undefined> {
    return Promise.resolve(invoices.find((inv) => inv.order_id === orderId));
  }

  // ── CREATE ──────────────────────────────────────────────

  static async createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      order_id: input.order_id,
      invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      total_amount: input.total_amount,
      status: "unpaid",
      issued_date: input.invoice_date,
      due_date: input.due_date,
    };

    // FUTURE: return fetch('/api/invoices', { method: 'POST', body: JSON.stringify(input) }).then(r => r.json());
    invoices.push(newInvoice);

    // Link back to order
    await OrdersService.setInvoice(input.order_id, newInvoice.id);
    await OrdersService.updatePaymentStatus(input.order_id, "unpaid");

    return Promise.resolve(newInvoice);
  }

  // ── UPDATE STATUS ────────────────────────────────────────

  static async markPaid(id: string): Promise<Invoice> {
    const idx = invoices.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error(`Invoice ${id} not found`);
    invoices[idx].status = "paid";

    const order = await OrdersService.getOrderById(invoices[idx].order_id);
    if (order) await OrdersService.updatePaymentStatus(order.id, "paid");

    return Promise.resolve(invoices[idx]);
  }

  static async markPartiallyPaid(id: string): Promise<Invoice> {
    const idx = invoices.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error(`Invoice ${id} not found`);
    invoices[idx].status = "partially_paid";

    const order = await OrdersService.getOrderById(invoices[idx].order_id);
    if (order) await OrdersService.updatePaymentStatus(order.id, "partially_paid");

    return Promise.resolve(invoices[idx]);
  }
}