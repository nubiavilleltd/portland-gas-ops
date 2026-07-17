import type { CreateOrderFormOutput, SaveDraftPayload } from "../schemas/create-order.schema";
import type { CreateOrderInput, SaveDraftInput } from "../types/orders.types";

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

export function buildDraftOrderPayload(form: SaveDraftPayload): SaveDraftInput {
  // Filter out items without a productId
  const realItems = form.orderItems?.filter(
    (item) => item.productId && item.productId.trim() !== ""
  );

  return {
    customerId: form.customerId,
    orderItems: realItems && realItems.length > 0
      ? realItems.map((item) => ({
          productId: item.productId as string,
          quantity: item.quantity ?? 1,
        }))
      : [], // Send empty array, not undefined
    discountType: form.discountType ?? "none",
    discountValue: form.discountValue ?? 0,
    deliveryAddress: form.deliveryAddress ?? "", // Send empty string, not undefined
    deliveryDate: form.deliveryDate ?? "", // Send empty string, not undefined
    notes: form.notes ?? "", // Send empty string, not undefined
  };
}