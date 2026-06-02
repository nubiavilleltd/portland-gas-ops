// workflows/saveDraftOrder.workflow.ts
import type { CreateOrderInput } from "../types/orders.types";
import { OrdersService } from "../services/orders.service";

export async function saveDraftOrderWorkflow(
  input: CreateOrderInput,
  existingDraftId?: string
) {
  if (existingDraftId) {
    return OrdersService.updateDraftOrder(existingDraftId, input);
  }
  return OrdersService.createDraftOrder(input);
}