import type { CreateOrderInput } from "../types/orders.types";
import { OrdersService } from "../services/orders.service";

export async function submitOrderWorkflow(
  input: CreateOrderInput,
  existingDraftNo?: string,
) {
  if (existingDraftNo) {
    // TODO:
    // Backend should atomically:
    //   1. Update the draft
    //   2. Submit the draft
    //
    // This should eventually become:
    //
    // return OrdersService.submitOrder(existingDraftNo, input);

    await OrdersService.updateDraftOrder(existingDraftNo, input);

    return OrdersService.submitOrder(existingDraftNo);
  }

 return OrdersService.createOrder(input);
}