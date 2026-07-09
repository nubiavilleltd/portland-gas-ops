// // workflows/saveDraftOrder.workflow.ts

import type { CreateOrderInput } from "../types/orders.types";
import { OrdersService } from "../services/orders.service";

export async function saveDraftOrderWorkflow(input: CreateOrderInput, existingDraftNo?: string) {
  if (existingDraftNo) {
    return OrdersService.updateDraftOrder(existingDraftNo, input);
  }
  return OrdersService.createDraftOrder(input);
}