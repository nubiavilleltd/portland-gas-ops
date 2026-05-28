import type { Order } from "../types/orders.types";
import { OrdersService } from "../services/orders.service";
import { canTransition } from "../guards/orders.guards";

export async function confirmDeliveryWorkflow(order: Order) {
  if (!order) {
    throw new Error("Order not loaded");
  }

//   if (!canTransition(order, "delivered")) {
//     throw new Error("Order cannot be marked as delivered");
//   }

  return OrdersService.updateFulfillmentStatus(
    order.id,
    "delivered"
  );
}