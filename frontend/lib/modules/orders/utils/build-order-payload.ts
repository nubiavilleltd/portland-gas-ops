import type { CreateOrderFormOutput, CreateOrderFormValues, SaveDraftPayload } from "../schemas/create-order.schema";
import type { CreateOrderInput } from "../types/orders.types";

// export function buildOrderPayload(
//   form: CreateOrderFormValues,
// ): CreateOrderInput {
//   return {
//     customerId: form.customerId,

//     deliveryAddress: form.deliveryAddress,
//     deliveryDate: form.deliveryDate,

//     notes: form.notes,

//     discountType: form.discountType ?? "none",
//     discountValue: form.discountValue ?? 0,

//     orderItems: form.orderItems.map((item) => ({
//       productId: item.productId,
//       quantity: item.quantity,
//     })),
//   };
// }

export function buildOrderPayload(
  form: CreateOrderFormOutput | SaveDraftPayload,
): CreateOrderInput {
  return {
    customerId: form.customerId ?? "",
    deliveryAddress: form.deliveryAddress ?? "",
    deliveryDate: form.deliveryDate ?? "",
    notes: form.notes,
    discountType: form.discountType ?? "none",
    discountValue: form.discountValue ?? 0,
    orderItems: (form.orderItems ?? []).map((item) => ({
      productId: item.productId ?? "",
      quantity: item.quantity ?? 0,
    })),
  };
}