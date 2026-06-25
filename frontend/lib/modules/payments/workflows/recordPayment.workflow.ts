// // lib/modules/payments/workflows/recordPayment.workflow.ts

// import type { PaymentForm } from "../schemas/payment.schema";
// import type { Invoice } from "@/lib/modules/invoices/types/invoice.types";
// import { PaymentsService } from "../services/payments.service";
// import { canRecordPayment } from "../guards/payments.guards";
// import type { PaymentMethod } from "../types/payments.types";

// export async function recordPaymentWorkflow(
//   invoice: Invoice,
//   data: PaymentForm
// ) {
//   if (!canRecordPayment(invoice)) {
//     throw new Error("This invoice has already been paid");
//   }

//   return PaymentsService.recordPayment({
//     invoice_id: invoice.id,
//     amount: Number(data.amount),
//     payment_method: data.payment_method as PaymentMethod,
//     payment_date: data.payment_date,
//     reference: data.reference,
//     recorded_by: "Admin User",
//   });
// }







// lib/modules/payments/workflows/recordPayment.workflow.ts

import type { PaymentForm } from "../schemas/payment.schema";
import type { Invoice } from "@/lib/modules/invoices/types/invoice.types";
import { PaymentsService } from "../services/payments.service";
import { canRecordPayment } from "../guards/payments.guards";
import type { PaymentMethod } from "../types/payments.types";
import { OrdersService } from "../../orders/services/orders.service";
import { AuditService } from "../../audit/services/audit.service";
import { CURRENT_ACTOR, SYSTEM_ACTOR } from "../../audit/constants/current-actor";
import { formatCurrency } from "@/lib/utils";

export async function recordPaymentWorkflow(
  invoice: Invoice,
  data: PaymentForm
) {
  if (!canRecordPayment(invoice)) {
    throw new Error("This invoice has already been paid");
  }

  const payment = await PaymentsService.recordPayment({
    invoice_id: invoice.id,
    amount: Number(data.amount),
    payment_method: data.payment_method as PaymentMethod,
    payment_date: data.payment_date,
    reference: data.reference,
    recorded_by: "Admin User",
  });

  

  // Audit: payment recorded against the invoice/order
  await AuditService.record({
    entity_type: "order",
    entity_id: invoice.order_id,
    action: "payment_recorded",
    description: `Payment of ${formatCurrency(data.amount)} recorded against invoice ${invoice.invoice_number}`,
    actor: CURRENT_ACTOR,
  });

  // If this payment brought the order to fully paid, the order auto-confirms.
  // Audit that automatic transition separately, with the system actor.
  const updatedOrder = await OrdersService.getOrderById(invoice.order_id);
  if (updatedOrder?.order_status === "confirmed") {
    await AuditService.record({
      entity_type: "order",
      entity_id: invoice.order_id,
      action: "confirmed",
      description: "Order automatically confirmed after payment received",
      actor: SYSTEM_ACTOR,
    });
  }

  return payment;
}