// workflows/submitOrder.workflow.ts
import type { CreateOrderInput } from "../types/orders.types";
import { OrdersService } from "../services/orders.service";
import { canSubmitOrder } from "../guards/orders.guards";

export async function submitOrderWorkflow(
  input: CreateOrderInput,
  existingDraftId?: string
) {
  if (existingDraftId) {
    // Draft exists — update it then transition to submitted
    const order = await OrdersService.getOrderById(existingDraftId);
    if (!order) throw new Error("Draft order not found");
    if (!canSubmitOrder(order)) throw new Error("Order cannot be submitted");
    await OrdersService.updateDraftOrder(existingDraftId, input);
    return OrdersService.submitOrder(existingDraftId);
  }

  // No draft — create and submit in one shot
  return OrdersService.createOrder(input);
}