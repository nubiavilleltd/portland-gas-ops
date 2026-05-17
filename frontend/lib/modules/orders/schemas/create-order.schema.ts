import { z } from "zod";

export const createOrderSchema = z.object({
  customer_id: z.string().min(1, "Select a customer"),

  order_type: z.enum([
    "Bulk CNG Supply",
    "LNG Delivery",
    "Retail Gas Refill",
  ]),

  product_name: z.string().min(1, "Select product"),

  quantity: z.string().min(1, "Enter quantity"),

  unit_price: z.string().min(1, "Enter unit price"),

  delivery_address: z
    .string()
    .min(3, "Enter delivery address"),

  delivery_date: z.string().optional(),

  notes: z.string().optional(),
});

export type CreateOrderFormValues =
  z.infer<typeof createOrderSchema>;