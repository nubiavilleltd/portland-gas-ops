// // ============================================================
// //  PAYMENTS SERVICE
// //  Single source of truth for all payment operations.
// //  Handles cascade: Payment → Invoice status → Order payment_status
// // ============================================================

// import { OrdersService } from "../../orders/services/orders.service";
// import { invoices } from "@/lib/modules/invoices/mock/invoices.mock";
// import { payments } from "@/lib/modules/payments/mocks/payments.mock";
// import { CreatePaymentInput, Payment, PaymentStatus } from "@/lib/modules/payments/types/payments.types";



// export class PaymentsService {
//   // ── READ ────────────────────────────────────────────────

//   static async getPayments(): Promise<Payment[]> {
//     return Promise.resolve([...payments]);
//   }

//   static async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
//     return Promise.resolve(payments.filter((p) => p.invoice_id === invoiceId));
//   }

//   static async getAmountPaid(invoiceId: string): Promise<number> {
//     const invoicePayments = await this.getPaymentsByInvoice(invoiceId);
//     return invoicePayments.reduce((sum, p) => sum + p.amount, 0);
//   }

//   // ── CREATE ──────────────────────────────────────────────

//   static async recordPayment(input: CreatePaymentInput): Promise<Payment> {
//     const invoice = invoices.find((i) => i.id === input.invoice_id);
//     if (!invoice) throw new Error(`Invoice ${input.invoice_id} not found`);

//     // Calculate current balance
//     const alreadyPaid = await this.getAmountPaid(input.invoice_id);
//     const balance = invoice.total_amount - alreadyPaid;

//     if (input.amount > balance) {
//       throw new Error(
//         `Payment amount (₦${input.amount.toLocaleString()}) exceeds outstanding balance (₦${balance.toLocaleString()})`
//       );
//     }

//     const newPayment: Payment = {
//       id: `pay-${Date.now()}`,
//       invoice_id: input.invoice_id,
//       reference: input.reference || `PAY-${Date.now()}`,
//       amount: input.amount,
//       method: input.payment_method as any,
//       date: input.payment_date,
//       recorded_by: input.recorded_by || "System",
//     };

//     // FUTURE: return fetch('/api/payments', { method: 'POST', body: JSON.stringify(input) }).then(r => r.json());
//     payments.push(newPayment);

//     // ── CASCADE 1: Update invoice status ──────────────────
//     const newAmountPaid = alreadyPaid + input.amount;
//     const invoiceIdx = invoices.findIndex((i) => i.id === input.invoice_id);
//     const newInvoiceStatus =
//       newAmountPaid >= invoice.total_amount ? "paid" : "partially_paid";
//     invoices[invoiceIdx].status = newInvoiceStatus;

//     // ── CASCADE 2: Update order payment_status ────────────
//     const linkedOrder = await OrdersService.getOrderById(invoice.order_id);
//     if (linkedOrder) {
//       const orderPaymentStatus: PaymentStatus =
//         newInvoiceStatus === "paid" ? "paid" : "partially_paid";
//       await OrdersService.updatePaymentStatus(linkedOrder.id, orderPaymentStatus);


//     }

//     return Promise.resolve(newPayment);
//   }
// }










import { paymentsApi } from "../api/payments.api";
import { adaptPayment, adaptPaymentList } from "../adapters/payment.adapter";
import { getErrorMessage } from "@/lib/api/error";
import type { Payment, CreatePaymentInput } from "../types/payments.types";
import { v4 as uuidv4 } from "uuid";

// Per-session idempotency key store
// One key per invoice — reused on retry, replaced on new payment
const idempotencyKeys: Record<string, string> = {};

function getIdempotencyKey(invoiceId: string): string {
  if (!idempotencyKeys[invoiceId]) {
    idempotencyKeys[invoiceId] = uuidv4();
  }
  return idempotencyKeys[invoiceId];
}

export function rotateIdempotencyKey(invoiceId: string): void {
  // Call this after successful payment to ensure next payment gets a fresh key
  delete idempotencyKeys[invoiceId];
}

export class PaymentsService {
  static async getPayments(): Promise<Payment[]> {
    const raw = await paymentsApi.list({ page_size: 200 });
    return adaptPaymentList(raw);
  }

  static async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    const raw = await paymentsApi.getByInvoice(invoiceId);
    return adaptPaymentList(raw);
  }

  static async getAmountPaid(invoiceId: string): Promise<number> {
    const payments = await PaymentsService.getPaymentsByInvoice(invoiceId);
    return payments.reduce((sum, p) => sum + p.amount, 0);
  }

  static async recordPayment(input: CreatePaymentInput): Promise<Payment> {
    try {
      const idempotencyKey = getIdempotencyKey(input.invoice_id);
      const raw = await paymentsApi.record(
        {
          invoice_id:   input.invoice_id,
          amount:       input.amount,
          method:       input.payment_method as any,
          payment_date: input.payment_date,
          reference:    input.reference,
        },
        idempotencyKey,
      );
      // Rotate key after success so next payment on same invoice is fresh
      rotateIdempotencyKey(input.invoice_id);
      return adaptPayment(raw);
      // Backend handles: invoice status update, order payment_status update, auto-confirm order
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to record payment"));
    }
  }
}