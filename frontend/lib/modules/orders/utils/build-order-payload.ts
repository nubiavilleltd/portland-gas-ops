// lib/modules/orders/utils/build-order-payload.ts

import type { CreateOrderFormValues } from "../schemas/create-order.schema";
import type { CreateOrderInput } from "../types/orders.types";
import { getProductById } from "@/lib/modules/products/selectors/products.selectors";
import type { Product } from "@/lib/modules/products/types/product.types";

export function buildOrderPayload(
  data: CreateOrderFormValues,
  products: Product[]
): CreateOrderInput {
  const primaryItem = data.order_items[0];
  const product = getProductById(products, primaryItem.product_id);
  return {
    customer_id: data.customer_id,
    order_type: data.order_type,
    product_name: product?.name ?? primaryItem.product_id,
    quantity: String(primaryItem.quantity),
    unit_price: String(primaryItem.unit_price),
    delivery_address: data.delivery_address,
    delivery_date: data.delivery_date,
    notes: data.notes,
  };
}