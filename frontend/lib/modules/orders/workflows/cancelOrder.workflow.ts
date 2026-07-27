import type { Order } from "../types/orders.types";
import { OrdersService } from "../services/orders.service";
import { canCancelOrder } from "../guards/orders.guards";

export async function cancelOrderWorkflow(order: Order, reason?: string): Promise<Order> {
  if (!canCancelOrder(order)) {
    throw new Error("This order cannot be cancelled in its current state");
  }
  // Backend handles: cancel + void invoice + update payment_status — all in one transaction
  return OrdersService.cancelOrder(order.orderNumber, reason);
}