import type { CreateOrderFormValues } from "../schemas/create-order.schema";
import type { CreateOrderInput } from "../types/orders.types";


export function buildOrderPayload(
  form: CreateOrderFormValues,
): CreateOrderInput {
  return {
    customerId: form.customerId,

    deliveryAddress: form.deliveryAddress,
    deliveryDate: form.deliveryDate,

    notes: form.notes,

    orderItems: form.orderItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
  };
}