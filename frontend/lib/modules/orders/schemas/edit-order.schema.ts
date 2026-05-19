import { z } from "zod";

export const editOrderItemSchema = z.object({
  product_name: z.string().min(1),
  quantity: z.number().min(1),
  unit_price: z.number().min(1),
});

export const editOrderSchema = z.object({
  customer_id: z.string().min(1),
  order_type: z.string().min(1),

  delivery_address: z.string().min(3),
  delivery_date: z.string().optional(),
  notes: z.string().optional(),

  order_items: z.array(editOrderItemSchema).min(1),
});

export type EditOrderFormData = z.infer<
  typeof editOrderSchema
>;