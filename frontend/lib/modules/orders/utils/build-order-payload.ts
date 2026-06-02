// lib/modules/orders/utils/build-order-payload.ts

import type { CreateOrderFormValues } from "../schemas/create-order.schema";
import type { CreateOrderInput } from "../types/orders.types";
import { getProductById } from "@/lib/modules/products/selectors/products.selectors";
import type { Product } from "@/lib/modules/products/types/product.types";

// export function buildOrderPayload(
//   data: CreateOrderFormValues,
//   products: Product[]
// ): CreateOrderInput {
//   const primaryItem = data.order_items[0];
//   const product = getProductById(products, primaryItem.product_id);
//   return {
//     customer_id: data.customer_id,
//     product_name: product?.name ?? primaryItem.product_id,
//     quantity: String(primaryItem.quantity),
//     unit_price: String(primaryItem.unit_price),
//     delivery_address: data.delivery_address,
//     delivery_date: data.delivery_date,
//     notes: data.notes,
//   };
// }



export function buildOrderPayload(
  data: CreateOrderFormValues,
  products: Product[]
): CreateOrderInput {
  return {
    customer_id: data.customer_id,
    order_items: data.order_items.map((item) => {
      const product = getProductById(products, item.product_id);
      return {
        product_id: item.product_id,
        product_name: product?.name ?? item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
      };
    }),
    delivery_address: data.delivery_address,
    delivery_date: data.delivery_date,
    notes: data.notes,
  };
}