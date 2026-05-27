// // import { OrdersService } from "../services/orders.service";
// // import { canConfirmOrder } from "../guards/orders.guards";
// // import type { Order } from "../types/orders.types";

// // export async function confirmOrderWorkflow(orderId: string): Promise<Order> {
// //   const order = await OrdersService.getOrderById(orderId);

// //   if (!order) {
// //     throw new Error("Order not found");
// //   }

// //   if (!canConfirmOrder(order)) {
// //     throw new Error("This order cannot be confirmed");
// //   }

// //   // 1. perform transition
// //   const updatedOrder = await OrdersService.confirmOrder(orderId);

// //   // 2. future hooks (IMPORTANT extension point)
// //   // await TimelineService.record(...)
// //   // await NotificationService.emit(...)
// //   // await InvoiceWorkflow.autoPrepare(orderId)

// //   return updatedOrder!;
// // }




// import { OrdersService } from "../services/orders.service";
// import {
//   canConfirmOrder,
//   canTransition,
// } from "../guards/orders.guards";


// import type { Order } from "../types/orders.types";
// import { ORDER_KEYS } from "../constants/query-keys";
// import { queryClient } from "@/components/Providers";

// /**
//  * CONFIRM ORDER WORKFLOW
//  * Orchestrates validation + state transition + cache update
//  */
// export async function confirmOrderWorkflow(order: Order) {
//   // 1. GUARD CHECK (business rule)
//   if (!canConfirmOrder(order)) {
//     throw new Error("Order cannot be confirmed in its current state");
//   }

//   // 2. STATE MACHINE CHECK (transition validity)
//   if (!canTransition(order, "confirmed")) {
//     throw new Error("Invalid state transition to 'confirmed'");
//   }

//   // 3. EXECUTE MUTATION (service layer)
//   const updatedOrder = await OrdersService.confirmOrder(order.id);

//   // 4. UPDATE CACHE INSTANTLY (prevents flicker)
//   queryClient.setQueryData(
//     ORDER_KEYS.detail(order.id),
//     updatedOrder
//   );

//   // 5. OPTIONAL: update list cache too
//   queryClient.setQueryData(ORDER_KEYS.lists(), (old?: Order[]) => {
//     if (!old) return old;
//     return old.map((o) =>
//       o.id === order.id ? updatedOrder : o
//     );
//   });

//   return updatedOrder;
// }




// workflows/confirm-order.workflow.ts

import type { Order } from "../types/orders.types";
import { OrdersService } from "../services/orders.service";
import { canConfirmOrder, canTransition } from "../guards/orders.guards";

export async function confirmOrderWorkflow(order: Order) {
  if (!canConfirmOrder(order)) {
    throw new Error("Order cannot be confirmed");
  }

  if (!canTransition(order, "confirmed")) {
    throw new Error("Invalid transition: draft → confirmed");
  }

  return OrdersService.confirmOrder(order.id);
}