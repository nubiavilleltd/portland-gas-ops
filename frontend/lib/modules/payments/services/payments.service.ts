import { paymentsApi } from "../api/payments.api";
import { adaptPayment, adaptPaymentList } from "../adapters/payment.adapter";
import { getErrorMessage } from "@/lib/api/error";
import type { Payment, CreatePaymentInput } from "../types/payments.types";
const uuidv4 = () => crypto.randomUUID();

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
      const formData = new FormData();

      formData.append("invoice_id", input.invoice_id);
      formData.append("amount", input.amount.toString());
      formData.append("method", input.payment_method);
      formData.append("payment_date", input.payment_date);

      if (input.reference) {
        formData.append("reference", input.reference);
      }

      input.paymentProofs.forEach((file) => {
        formData.append("payment_proofs", file);
      });
      const raw = await paymentsApi.record(
        formData,
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