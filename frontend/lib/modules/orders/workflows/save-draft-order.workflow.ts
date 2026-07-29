// // workflows/saveDraftOrder.workflow.ts

import type { CreateOrderInput, SaveDraftInput } from "../types/orders.types";
import { OrdersService } from "../services/orders.service";

export async function saveDraftOrderWorkflow(input: SaveDraftInput, existingDraftNo?: string) {
  if (existingDraftNo) {
    return OrdersService.updateDraftOrder(existingDraftNo, input);
  }
  return OrdersService.createDraftOrder(input);
}