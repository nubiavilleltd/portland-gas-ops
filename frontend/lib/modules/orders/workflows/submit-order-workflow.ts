// workflows/submitOrder.workflow.ts
import type { CreateOrderInput } from "../types/orders.types";
import { OrdersService } from "../services/orders.service";
import { canSubmitOrder } from "../guards/orders.guards";
import { AuditService } from "../../audit/services/audit.service";
import { CURRENT_ACTOR } from "../../audit/constants/current-actor";

// export async function submitOrderWorkflow(
//   input: CreateOrderInput,
//   existingDraftId?: string
// ) {
//   if (existingDraftId) {
//     // Draft exists — update it then transition to submitted
//     const order = await OrdersService.getOrderById(existingDraftId);
//     if (!order) throw new Error("Draft order not found");
//     if (!canSubmitOrder(order)) throw new Error("Order cannot be submitted");
//     await OrdersService.updateDraftOrder(existingDraftId, input);
//     return OrdersService.submitOrder(existingDraftId);
//   }

//   // No draft — create and submit in one shot
//   return OrdersService.createOrder(input);
// }


export async function submitOrderWorkflow(
  input: CreateOrderInput,
  existingDraftId?: string
) {
  if (existingDraftId) {
    const order = await OrdersService.getOrderById(existingDraftId);
    if (!order) throw new Error("Draft order not found");
    if (!canSubmitOrder(order)) throw new Error("Order cannot be submitted");

    await OrdersService.updateDraftOrder(existingDraftId, input);
    const submitted = await OrdersService.submitOrder(existingDraftId);

    await AuditService.record({
      entity_type: "order",
      entity_id: submitted.id,
      action: "submitted",
      description: "Order submitted for processing",
      actor: CURRENT_ACTOR,
    });

    return submitted;
  }

  // No draft — create and submit in one shot
  const created = await OrdersService.createOrder(input);

  await AuditService.record({
    entity_type: "order",
    entity_id: created.id,
    action: "created",
    description: "Order created and submitted directly",
    actor: CURRENT_ACTOR,
  });

  return created;
}