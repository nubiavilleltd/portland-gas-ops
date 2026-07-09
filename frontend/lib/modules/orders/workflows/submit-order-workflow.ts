// import type { CreateOrderInput } from "../types/orders.types";
// import { OrdersService } from "../services/orders.service";
// import { canSubmitOrder } from "../guards/orders.guards";

// export async function submitOrderWorkflow(
//   input: CreateOrderInput,
//   existingDraftId?: string,
// ) {
//   if (existingDraftId) {
//     const draft = await OrdersService.getOrderById(existingDraftId);

//     if (!draft) {
//       throw new Error("Draft order not found");
//     }

//     if (!canSubmitOrder(draft)) {
//       throw new Error("Order cannot be submitted");
//     }

//     await OrdersService.updateDraftOrder(existingDraftId, input);

//     return OrdersService.submitOrder(existingDraftId);
//   }

//   // TODO:
// // This should call a dedicated backend endpoint that creates
// // and immediately submits an order in a single request.
// //
// // Example:
// // return OrdersService.createOrder(input);

//   throw new Error("Create Order endpoint not implemented yet.");
// }







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

  // TODO:
  // Backend should expose a dedicated endpoint that creates
  // and immediately submits an order in a single request.
  //
  // This should eventually become:
  //
  // return OrdersService.createOrder(input);

  throw new Error("Create Order endpoint not implemented yet.");
}