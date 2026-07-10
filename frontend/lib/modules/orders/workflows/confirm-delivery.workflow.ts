import type { Order } from "../types/orders.types";
import { OrdersService } from "../services/orders.service";
import { canConfirmDelivery } from "../guards/orders.guards";

export async function confirmDeliveryWorkflow(order: Order): Promise<Order> {
  if (!canConfirmDelivery(order)) {
    throw new Error("Delivery cannot be confirmed for this order");
  }
  // Backend sets delivered + auto-closes if paid — single endpoint, single transaction
  return OrdersService.confirmDelivery(order.id);
}