import type { CreateOrderInput } from "../types/orders.types";
import { OrdersService } from "../services/orders.service";

export async function submitOrderWorkflow(
  input: CreateOrderInput,
  existingDraftId?: string,
) {
  if (existingDraftId) {
    // TODO:
    // Backend should atomically:
    //   1. Update the draft
    //   2. Submit the draft
    //
    // This should eventually become:
    //
    // return OrdersService.submitOrder(existingDraftId, input);

    await OrdersService.updateDraftOrder(existingDraftId, input);

    return OrdersService.submitOrder(existingDraftId);
  }

 return OrdersService.createOrder(input);
}