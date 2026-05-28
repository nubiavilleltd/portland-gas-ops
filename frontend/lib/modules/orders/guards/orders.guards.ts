import type { Order } from "../types/orders.types";

/**
 * Can the order be edited?
 */
export function canEditOrder(order: Order): boolean {
  return order.order_status === "draft";
}

/**
 * Can the order be confirmed?
 */
export function canConfirmOrder(order: Order): boolean {
  return order.order_status === "draft";
}

/**
 * Can order be assigned to a trip?
 */
export function canAssignToTrip(order: Order): boolean {
  return (
    order.order_status === "confirmed" &&
    order.fulfillment_status === "pending"
  );
}

/**
 * Can order go into dispatch flow?
 * (workflow gate — not UI logic)
 */
export function canDispatchOrder(order: Order): boolean {
  if (order.order_status !== "confirmed") return false;

  if (order.requires_approval && order.approval_status !== "approved") {
    return false;
  }

  return true;
}

/**
 * Can invoice be generated?
 */
export function canGenerateInvoice(order: Order): boolean {
  return order.fulfillment_status === "delivered" && !order.invoice_id;
}

export function canConfirmDelivery(order: Order): boolean {
  return order.fulfillment_status === "dispatched" ||
    order.fulfillment_status === "in_transit";

}



/**
 * Can order be closed?
 */
export function canCloseOrder(order: Order): boolean {
  return (
    order.fulfillment_status === "delivered" &&
    order.payment_status === "paid"
  );
}


