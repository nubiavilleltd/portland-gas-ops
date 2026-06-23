// ============================================================
//  PAYMENTS SERVICE
//  Single source of truth for all payment operations.
//  Handles cascade: Payment → Invoice status → Order payment_status
// ============================================================

import { OrdersService } from "../../orders/services/orders.service";
import { invoices } from "@/lib/modules/invoices/mock/invoices.mock";
import { payments } from "@/lib/modules/payments/mocks/payments.mock";
import { CreatePaymentInput, Payment, PaymentStatus } from "@/lib/modules/payments/types/payments.types";



export class PaymentsService {
  // ── READ ────────────────────────────────────────────────

  static async getPayments(): Promise<Payment[]> {
    return Promise.resolve([...payments]);
  }

  static async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    return Promise.resolve(payments.filter((p) => p.invoice_id === invoiceId));
  }

  static async getAmountPaid(invoiceId: string): Promise<number> {
    const invoicePayments = await this.getPaymentsByInvoice(invoiceId);
    return invoicePayments.reduce((sum, p) => sum + p.amount, 0);
  }

  // ── CREATE ──────────────────────────────────────────────

  static async recordPayment(input: CreatePaymentInput): Promise<Payment> {
    const invoice = invoices.find((i) => i.id === input.invoice_id);
    if (!invoice) throw new Error(`Invoice ${input.invoice_id} not found`);

    // Calculate current balance
    const alreadyPaid = await this.getAmountPaid(input.invoice_id);
    const balance = invoice.total_amount - alreadyPaid;

    if (input.amount > balance) {
      throw new Error(
        `Payment amount (₦${input.amount.toLocaleString()}) exceeds outstanding balance (₦${balance.toLocaleString()})`
      );
    }

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      invoice_id: input.invoice_id,
      reference: input.reference || `PAY-${Date.now()}`,
      amount: input.amount,
      method: input.payment_method as any,
      date: input.payment_date,
      recorded_by: input.recorded_by || "System",
    };

    // FUTURE: return fetch('/api/payments', { method: 'POST', body: JSON.stringify(input) }).then(r => r.json());
    payments.push(newPayment);

    // ── CASCADE 1: Update invoice status ──────────────────
    const newAmountPaid = alreadyPaid + input.amount;
    const invoiceIdx = invoices.findIndex((i) => i.id === input.invoice_id);
    const newInvoiceStatus =
      newAmountPaid >= invoice.total_amount ? "paid" : "partially_paid";
    invoices[invoiceIdx].status = newInvoiceStatus;

    // ── CASCADE 2: Update order payment_status ────────────
    const linkedOrder = await OrdersService.getOrderById(invoice.order_id);
    if (linkedOrder) {
      const orderPaymentStatus: PaymentStatus =
        newInvoiceStatus === "paid" ? "paid" : "partially_paid";
      await OrdersService.updatePaymentStatus(linkedOrder.id, orderPaymentStatus);


    }

    return Promise.resolve(newPayment);
  }
}