
import { z } from "zod";

// ── Single line item ───────────────────────────────────────
export const orderLineItemSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  quantity: z
    .number({ message: "Enter a quantity" })
    .min(0.01, "Quantity must be greater than 0"),
  unitPrice: z
    .number({ message: "Enter a unit price" })
    .min(0.01, "Unit price must be greater than 0"),
  inventoryItemIds: z.array(z.string()).optional(),
});

export type OrderLineItem = z.infer<typeof orderLineItemSchema>;

// ── Full create-order schema ───────────────────────────────
export const createOrderSchema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  orderItems: z
    .array(orderLineItemSchema)
    .min(1, "Add at least one product to the order"),

  deliveryAddress: z
    .string()
    .min(3, "Enter a valid delivery address"),

  deliveryDate: z.string().optional(),

  notes: z.string().optional(),
});

export type CreateOrderFormValues = z.infer<typeof createOrderSchema>;
