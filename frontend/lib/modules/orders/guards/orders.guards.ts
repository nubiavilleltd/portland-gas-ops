import { Invoice } from "../../invoices/types/invoice.types";
import type { Order } from "../types/orders.types";

export function isDraft(order: Order) {
  return order.orderStatus === "draft";
}

export const canEditOrder = isDraft;

export function canUpdateDraft(order: Order) {
  return isDraft(order);
}

export function canSubmitOrder(order: Order) {
  return isDraft(order);
}

export function canConfirmOrder(order: Order) {
  return order.orderStatus === "submitted";
}

export function canAssignToTrip(order: Order) {
  return (
    order.orderStatus === "confirmed" &&
    order.fulfillmentStatus === "pending" &&
    order.paymentStatus === "paid"
  );
}

export function canDispatchOrder(order: Order) {
  if (order.orderStatus !== "confirmed") {
    return false;
  }

  // Future approval rules go here.

  return true;
}

export function canGenerateInvoice(order: Order) {
  return (
    order.orderStatus === "submitted" &&
    !order.invoiceId
  );
}

export function canConfirmDelivery(order: Order) {
  return (
    order.orderStatus === "confirmed" &&
    order.fulfillmentStatus === "in_transit"
  );
}

export function canCloseOrder(order: Order) {
  return (
    order.fulfillmentStatus === "delivered" &&
    order.paymentStatus === "paid"
  );
}

export function canCancelOrder(order: Order) {
  if (
    ["draft", "completed", "cancelled"].includes(order.orderStatus)
  ) {
    return false;
  }

  if (
    ["dispatched", "in_transit", "delivered"].includes(
      order.fulfillmentStatus
    )
  ) {
    return false;
  }

  return true;
}

export function canMakePayment(invoice: Invoice | undefined, order: Order | undefined) {
  return (
    !!invoice &&
    !!order &&
    order.paymentStatus !== "paid" &&
    order.orderStatus !== "cancelled"
  );
}