// // ============================================================
// //  INVOICES SERVICE
// //  Single source of truth for all invoice operations.
// //  Backed by mock data. Swap for fetch() calls when backend is ready.
// // ============================================================

// import { CreateInvoiceInput, Invoice } from "@/lib/modules/invoices/types/invoice.types";
// import { invoices } from "@/lib/modules/invoices/mock/invoices.mock";
// import { OrdersService } from "@/lib/modules/orders/services/orders.service";



// export class InvoicesService {
//   // ── READ ────────────────────────────────────────────────

//   static async getInvoices(): Promise<Invoice[]> {
//     // FUTURE: return fetch('/api/invoices').then(r => r.json());
//     return Promise.resolve([...invoices]);
//   }

//   static async getInvoiceById(id: string): Promise<Invoice | undefined> {
//     return Promise.resolve(invoices.find((inv) => inv.id === id));
//   }
//   //   static async getInvoiceById(id: string): Promise<Invoice | undefined> {
//   //     return Promise.resolve(invoices.find((inv) => inv.id === id));
//   //   }

//   static async getInvoiceByOrderId(orderId: string): Promise<Invoice | undefined> {
//     return Promise.resolve(invoices.find((inv) => inv.order_id === orderId));
//   }

//   // ── CREATE ──────────────────────────────────────────────

//   static async createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
//     const newInvoice: Invoice = {
//       id: `inv-${Date.now()}`,
//       order_id: input.order_id,
//       invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
//       total_amount: input.total_amount,
//       status: "unpaid",
//       issued_date: input.invoice_date,
//       due_date: input.due_date,
//     };

//     // FUTURE: return fetch('/api/invoices', { method: 'POST', body: JSON.stringify(input) }).then(r => r.json());
//     invoices.push(newInvoice);

//     // Link back to order
//     await OrdersService.setInvoice(input.order_id, newInvoice.id);
//     await OrdersService.updatePaymentStatus(input.order_id, "unpaid");

//     return Promise.resolve(newInvoice);
//   }

//   // ── UPDATE STATUS ────────────────────────────────────────

//   static async markPaid(id: string): Promise<Invoice> {
//     const idx = invoices.findIndex((i) => i.id === id);
//     if (idx === -1) throw new Error(`Invoice ${id} not found`);
//     invoices[idx].status = "paid";

//     const order = await OrdersService.getOrderById(invoices[idx].order_id);
//     if (order) await OrdersService.updatePaymentStatus(order.id, "paid");

//     return Promise.resolve(invoices[idx]);
//   }

//   static async markPartiallyPaid(id: string): Promise<Invoice> {
//     const idx = invoices.findIndex((i) => i.id === id);
//     if (idx === -1) throw new Error(`Invoice ${id} not found`);
//     invoices[idx].status = "partially_paid";

//     const order = await OrdersService.getOrderById(invoices[idx].order_id);
//     if (order) await OrdersService.updatePaymentStatus(order.id, "partially_paid");

//     return Promise.resolve(invoices[idx]);
//   }


// // invoices.service.ts — voidInvoice, corrected to also sync the order
// static async voidInvoice(orderId: string): Promise<Invoice | undefined> {
//   const idx = invoices.findIndex((i) => i.order_id === orderId);
//   if (idx === -1) return undefined;

//   if (invoices[idx].status === "unpaid" || invoices[idx].status === "partially_paid") {
//     invoices[idx].status = "void";
//     await OrdersService.updatePaymentStatus(orderId, "void");
//   }

//   return Promise.resolve(invoices[idx]);
// }
// }









import { invoicesApi } from "../api/invoices.api";
import { adaptInvoice, adaptInvoiceList } from "../adapters/invoice.adapter";
import { getErrorMessage } from "@/lib/api/error";
import type { Invoice, CreateInvoiceInput } from "../types/invoice.types";
import { OrdersService } from "../../orders/services/orders.service";

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
        invoice_date: input.invoice_date,
        due_date:     input.due_date,
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