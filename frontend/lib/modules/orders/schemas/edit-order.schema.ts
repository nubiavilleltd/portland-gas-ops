// import { z } from "zod";

// export const editOrderItemSchema = z.object({
//   product_name: z.string().min(1),
//   quantity: z.number().min(1),
//   unit_price: z.number().min(1),
// });

// export const editOrderSchema = z.object({
//   customer_id: z.string().min(1),
//   order_type: z.string().min(1),

//   delivery_address: z.string().min(3),
//   delivery_date: z.string().optional(),
//   notes: z.string().optional(),

//   order_items: z.array(editOrderItemSchema).min(1),
// });

// export type EditOrderFormData = z.infer<
//   typeof editOrderSchema
// >;






// edit-order.schema.ts
import { z } from "zod";

// Line item uses product_id (same as create) so OrderForm's
// product <select> works identically in both create and edit.
export const editOrderLineItemSchema = z.object({
  product_id:  z.string().min(1, "Select a product"),
  quantity:    z.number({ message: "Enter a quantity" }).min(0.01, "Quantity must be greater than 0"),
  unit_price:  z.number({ message: "Enter a unit price" }).min(0.01, "Unit price must be greater than 0"),
});

export const editOrderSchema = z.object({
  customer_id:      z.string().min(1, "Select a customer"),
  order_type:       z.string().min(1, "Select an order type"),   // string, not enum — tolerates legacy values
  order_items:      z.array(editOrderLineItemSchema).min(1, "Add at least one product to the order"),
  delivery_address: z.string().min(3, "Enter a valid delivery address"),
  delivery_date:    z.string().optional(),
  notes:            z.string().optional(),
});

export type EditOrderFormValues = z.infer<typeof editOrderSchema>;