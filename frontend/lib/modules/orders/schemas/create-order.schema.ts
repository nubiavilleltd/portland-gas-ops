
import { z } from "zod";

// ── Single line item ───────────────────────────────────────
export const orderLineItemSchema = z.object({
  product_id: z.string().min(1, "Select a product"),
  quantity: z
    .number({ message: "Enter a quantity" })
    .min(0.01, "Quantity must be greater than 0"),
  unit_price: z
    .number({ message: "Enter a unit price" })
    .min(0.01, "Unit price must be greater than 0"),
});

export type OrderLineItem = z.infer<typeof orderLineItemSchema>;

// ── Full create-order schema ───────────────────────────────
export const createOrderSchema = z.object({
  customer_id: z.string().min(1, "Select a customer"),

  order_type: z.enum(
    ["Bulk CNG Supply", "LNG Delivery", "Retail Gas Refill"],
    { message: "Select an order type" }
  ),

  order_items: z
    .array(orderLineItemSchema)
    .min(1, "Add at least one product to the order"),

  delivery_address: z
    .string()
    .min(3, "Enter a valid delivery address"),

  delivery_date: z.string().optional(),

  notes: z.string().optional(),
});

export type CreateOrderFormValues = z.infer<typeof createOrderSchema>;
