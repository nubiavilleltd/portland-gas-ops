// // lib/modules/invoices/workflows/createInvoice.workflow.ts

// import type { InvoiceForm } from "../schemas/invoice.schema";
// import { canGenerateInvoice } from "@/lib/modules/orders/guards/orders.guards";
// import type { Order } from "@/lib/modules/orders/types/orders.types";
// import { InvoicesService } from "../services/invoice.services";

// export async function createInvoiceWorkflow(
//   order: Order,
//   data: InvoiceForm
// ): Promise<void> {
//   if (!canGenerateInvoice(order)) {
//     throw new Error("Invoice cannot be generated for this order");
//   }

//   await InvoicesService.createInvoice({
//     order_id: order.id,
//     total_amount: order.total_amount,
//     invoice_date: data.invoice_date,
//     due_date: data.due_date,
//   });
// }






import type { InvoiceForm } from "../schemas/invoice.schema";
import { canGenerateInvoice } from "@/lib/modules/orders/guards/orders.guards";
import type { Order } from "@/lib/modules/orders/types/orders.types";
import { InvoicesService } from "../services/invoice.services";

export async function createInvoiceWorkflow(order: Order, data: InvoiceForm): Promise<void> {
  if (!canGenerateInvoice(order)) {
    throw new Error("Invoice cannot be generated for this order");
  }
  // Backend handles: create invoice + link to order + set order.payment_status=unpaid
  await InvoicesService.createInvoice({
    order_id:     order.id,
    total_amount: order.total_amount,
    invoice_date: data.invoice_date,
    due_date:     data.due_date,
  });
}