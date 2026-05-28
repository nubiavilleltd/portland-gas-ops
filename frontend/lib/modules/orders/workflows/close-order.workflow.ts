import type { Order } from "../types/orders.types";
import { OrdersService } from "../services/orders.service";
import { canCloseOrder } from "../guards/orders.guards";
import { canTransition } from "../guards/orders.guards";

export async function closeOrderWorkflow(order: Order) {
  if (!order) {
    throw new Error("Order not loaded");
  }

  if (!canCloseOrder(order)) {
    throw new Error("Only delivered orders can be closed");
  }

//   if (!canTransition(order, "closed")) {
//     throw new Error("Invalid transition: delivered → closed");
//   }

  return OrdersService.closeOrder(order.id);
}