// // workflows/saveDraftOrder.workflow.ts
// import type { CreateOrderInput } from "../types/orders.types";
// import { OrdersService } from "../services/orders.service";
// import { AuditService } from "../../audit/services/audit.service";
// import { CURRENT_ACTOR } from "../../audit/constants/current-actor";

// // export async function saveDraftOrderWorkflow(
// //   input: CreateOrderInput,
// //   existingDraftId?: string
// // ) {
// //   if (existingDraftId) {
// //     return OrdersService.updateDraftOrder(existingDraftId, input);
// //   }
// //   return OrdersService.createDraftOrder(input);
// // }



// export async function saveDraftOrderWorkflow(
//   input: CreateOrderInput,
//   existingDraftId?: string
// ) {
//   if (existingDraftId) {
//     const updated = await OrdersService.updateDraftOrder(existingDraftId, input);

//     await AuditService.record({
//       entity_type: "order",
//       entity_id: updated.id,
//       action: "draft_updated",
//       description: "Draft order updated",
//       actor: CURRENT_ACTOR,
//     });

//     return updated;
//   }

//   const created = await OrdersService.createDraftOrder(input);

//   await AuditService.record({
//     entity_type: "order",
//     entity_id: created.id,
//     action: "created",
//     description: "Order created as draft",
//     actor: CURRENT_ACTOR,
//   });

//   return created;
// }





import type { CreateOrderInput } from "../types/orders.types";
import { OrdersService } from "../services/orders.service";

export async function saveDraftOrderWorkflow(input: CreateOrderInput, existingDraftId?: string) {
  if (existingDraftId) {
    return OrdersService.updateDraftOrder(existingDraftId, input);
  }
  return OrdersService.createDraftOrder(input);
}