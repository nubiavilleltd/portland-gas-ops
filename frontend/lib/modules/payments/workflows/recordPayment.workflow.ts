// lib/modules/payments/workflows/recordPayment.workflow.ts

import type { PaymentForm } from "../schemas/payment.schema";
import type { Invoice } from "@/lib/modules/invoices/types/invoice.types";
import { PaymentsService } from "../services/payments.service";
import { canRecordPayment } from "../guards/payments.guards";
import type { PaymentMethod } from "../types/payments.types";

export async function recordPaymentWorkflow(
  invoice: Invoice,
  data: PaymentForm
) {
  if (!canRecordPayment(invoice)) {
    throw new Error("This invoice has already been paid");
  }

  return PaymentsService.recordPayment({
    invoice_id: invoice.id,
    amount: Number(data.amount),
    payment_method: data.payment_method as PaymentMethod,
    payment_date: data.payment_date,
    reference: data.reference,
    recorded_by: "Admin User",
  });
}