import type { Order } from "../types/orders.types";
import { OrdersService } from "../services/orders.service";
import { canCloseOrder } from "../guards/orders.guards";
import { AuditService } from "../../audit/services/audit.service";
import { CURRENT_ACTOR } from "../../audit/constants/current-actor";

// export async function closeOrderWorkflow(order: Order) {
//   if (!order) {
//     throw new Error("Order not loaded");
//   }

//   if (!canCloseOrder(order)) {
//     throw new Error("Only delivered orders can be closed");
//   }


//   return OrdersService.closeOrder(order.id);
// }




export async function closeOrderWorkflow(order: Order) {
  if (!order) {
    throw new Error("Order not loaded");
  }
  if (!canCloseOrder(order)) {
    throw new Error("Only delivered orders can be closed");
  }

  const closed = await OrdersService.closeOrder(order.id);

  await AuditService.record({
    entity_type: "order",
    entity_id: order.id,
    action: "completed",
    description: "Order closed",
    actor: CURRENT_ACTOR,
  });

  return closed;
}