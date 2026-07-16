
// import { z } from "zod";
// import type { DiscountType } from "../types/orders.types";

// // ── Single line item ───────────────────────────────────────
// export const orderLineItemSchema = z.object({
//   productId: z.string().min(1, "Select a product"),

//   quantity: z
//     .number({ message: "Enter a quantity" })
//     .min(0.01, "Quantity must be greater than 0"),

//   inventoryItemIds: z.array(z.string()).optional(),
// });

// export type OrderLineItem = z.infer<typeof orderLineItemSchema>;

// // ── Full create-order schema ───────────────────────────────
// export const createOrderSchema = z.object({
//   customerId: z.string().min(1, "Select a customer"),

//   orderItems: z
//     .array(orderLineItemSchema)
//     .min(1, "Add at least one product to the order"),

//   discountType: z.enum([
//   "none",
//   "fixed",
//   "percentage",
// ]).default("none"),

//   discountValue: z
//     .number({ message: "Enter a discount value" })
//     .min(0)
//     .default(0),

//   deliveryAddress: z
//     .string()
//     .min(3, "Enter a valid delivery address"),

//   deliveryDate: z.string().optional(),

//   notes: z.string().optional(),
// })

// export type CreateOrderFormValues = z.infer<typeof createOrderSchema>;





import { z } from "zod";
import type { DiscountType } from "../types/orders.types";

// ── Single line item ───────────────────────────────────────
export const orderLineItemSchema = z.object({
  productId: z.string().min(1, "Select a product"),

  quantity: z
    .number({ message: "Enter a quantity" })
    .min(0.01, "Quantity must be greater than 0"),

  inventoryItemIds: z.array(z.string()).optional(),
});

export type OrderLineItem = z.infer<typeof orderLineItemSchema>;

// ── Full create-order schema ───────────────────────────────
export const createOrderSchema = z.object({
  customerId: z.string().min(1, "Select a customer"),

  orderItems: z
    .array(orderLineItemSchema)
    .min(1, "Add at least one product to the order"),

  discountType: z.enum([
    "none",
    "fixed",
    "percentage",
  ]).default("none"),

  discountValue: z
    .number({ message: "Enter a discount value" })
    .min(0)
    .default(0),

  deliveryAddress: z
    .string()
    .min(3, "Enter a valid delivery address"),

  deliveryDate: z
  .string()
  .min(1, "Delivery date is required")
  .refine((val) => {
    const today = new Date().toISOString().split("T")[0];
    return val >= today; // safe since both are YYYY-MM-DD strings
  }, "Delivery date cannot be in the past"),

  notes: z.string().optional(),
});




export const saveDraftSchema = z.object({
  customerId: z.string().optional(),
  orderItems: z
    .array(
      orderLineItemSchema.partial().extend({
        // keep quantity correctness even when optional
        quantity: z.number().min(0.01, "Quantity must be greater than 0").optional(),
      })
    )
    .optional(),
  discountType: z.enum(["none", "fixed", "percentage"]).optional(),
  discountValue: z.number().min(0).optional(),
  deliveryAddress: z.string().optional(),
  deliveryDate: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true; // empty is fine for drafts
      const today = new Date().toISOString().split("T")[0];
      return val >= today;
    }, "Delivery date cannot be in the past"),
  notes: z.string().optional(),
});

// `z.infer` is an alias for `z.output` — it reflects the shape *after*
// defaults are applied (discountType/discountValue required). That's not
// what the form actually holds while the user is filling it out.
//
// `CreateOrderFormValues` = what useForm's state/defaultValues use (input,
// defaults optional).
// `CreateOrderFormOutput` = what you get back after zodResolver runs
// (output, defaults applied) — use this for onSubmit/onSaveDraft callbacks.
export type CreateOrderFormValues = z.input<typeof createOrderSchema>;
export type CreateOrderFormOutput = z.output<typeof createOrderSchema>;
export type SaveDraftPayload = z.infer<typeof saveDraftSchema>;
