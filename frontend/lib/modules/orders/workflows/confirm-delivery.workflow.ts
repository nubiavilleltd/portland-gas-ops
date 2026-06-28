// import type { Order } from "../types/orders.types";
// import { OrdersService } from "../services/orders.service";
// import { canConfirmDelivery } from "../guards/orders.guards";
// import { AuditService } from "../../audit/services/audit.service";
// import { CURRENT_ACTOR, SYSTEM_ACTOR } from "../../audit/constants/current-actor";

// // export async function confirmDeliveryWorkflow(order: Order) {
// //   if (!canConfirmDelivery(order)) {
// //     throw new Error("Delivery cannot be confirmed for this order");
// //   }

// //   await OrdersService.updateFulfillmentStatus(order.id, "delivered");
// //   return OrdersService.closeOrder(order.id);
// // }



// export async function confirmDeliveryWorkflow(order: Order) {
//   if (!canConfirmDelivery(order)) {
//     throw new Error("Delivery cannot be confirmed for this order");
//   }

//   await OrdersService.updateFulfillmentStatus(order.id, "delivered");

//   await AuditService.record({
//     entity_type: "order",
//     entity_id: order.id,
//     action: "delivered",
//     description: "Delivery confirmed",
//     actor: CURRENT_ACTOR,
//   });

//   const closed = await OrdersService.closeOrder(order.id);

//   await AuditService.record({
//     entity_type: "order",
//     entity_id: order.id,
//     action: "completed",
//     description: "Order closed — fully delivered and paid",
//     actor: SYSTEM_ACTOR,    // closure here is automatic/cascaded, not a separate human click
//   });

//   return closed;
// }





import type { Order } from "../types/orders.types";
import { OrdersService } from "../services/orders.service";
import { canConfirmDelivery } from "../guards/orders.guards";

export async function confirmDeliveryWorkflow(order: Order): Promise<Order> {
  if (!canConfirmDelivery(order)) {
    throw new Error("Delivery cannot be confirmed for this order");
  }
  // Backend sets delivered + auto-closes if paid — single endpoint, single transaction
  return OrdersService.closeOrder(order.id);
}