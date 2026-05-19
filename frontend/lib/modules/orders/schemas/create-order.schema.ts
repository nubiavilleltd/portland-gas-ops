// import { z } from "zod";

// export const createOrderSchema = z.object({
//   customer_id: z.string().min(1, "Select a customer"),

//   order_type: z.enum([
//     "Bulk CNG Supply",
//     "LNG Delivery",
//     "Retail Gas Refill",
//   ]),

//   product_name: z.string().min(1, "Select product"),

//   quantity: z.string().min(1, "Enter quantity"),

//   unit_price: z.string().min(1, "Enter unit price"),

//   delivery_address: z
//     .string()
//     .min(3, "Enter delivery address"),

//   delivery_date: z.string().optional(),

//   notes: z.string().optional(),
// });

// export type CreateOrderFormValues =
//   z.infer<typeof createOrderSchema>;






import { z } from "zod";

export const createOrderSchema = z.object({
  customer_id: z.string().min(1, "Select a customer"),

  order_type: z.enum([
    "Bulk CNG Supply",
    "LNG Delivery",
    "Retail Gas Refill",
  ]),

  product_name: z.string().min(1, "Select product"),

  // Accept string input from HTML, transform to number for validation
  quantity: z
    .string()
    .min(1, "Enter quantity")
    .transform((val) => parseFloat(val))
    .pipe(
      z
        .number({ invalid_type_error: "Must be a number" })
        .positive("Quantity must be positive")
        .min(1, "Minimum quantity is 1")
    ),

  unit_price: z
    .string()
    .min(1, "Enter unit price")
    .transform((val) => parseFloat(val))
    .pipe(
      z
        .number({ invalid_type_error: "Must be a number" })
        .positive("Unit price must be positive")
        .min(0.01, "Unit price must be at least 0.01")
    ),

  delivery_address: z
    .string()
    .min(3, "Enter a valid delivery address"),

  delivery_date: z.string().optional(),

  notes: z.string().optional(),
});

export type CreateOrderFormValues = z.infer<typeof createOrderSchema>;