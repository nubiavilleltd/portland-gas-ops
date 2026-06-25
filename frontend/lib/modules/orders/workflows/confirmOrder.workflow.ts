// workflows/confirm-order.workflow.ts

import type { Order } from "../types/orders.types";
import { OrdersService } from "../services/orders.service";
import { canConfirmOrder } from "../guards/orders.guards";
import { AuditService } from "../../audit/services/audit.service";
import { CURRENT_ACTOR } from "../../audit/constants/current-actor";

// export async function confirmOrderWorkflow(order: Order) {
//   if (!canConfirmOrder(order)) {
//     throw new Error("Order cannot be confirmed");
//   }

// //   if (!canTransition(order, "confirmed")) {
// //     throw new Error("Invalid transition: draft → confirmed");
// //   }

//   return OrdersService.confirmOrder(order.id);
// }



export async function confirmOrderWorkflow(order: Order) {
  if (!canConfirmOrder(order)) {
    throw new Error("Order cannot be confirmed");
  }
  const updated = await OrdersService.confirmOrder(order.id);

  await AuditService.record({
    entity_type: "order",
    entity_id: order.id,
    action: "confirmed",
    description: "Order manually confirmed",
    actor: CURRENT_ACTOR,
  });

  return updated;
}