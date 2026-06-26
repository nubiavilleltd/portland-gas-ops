import { z } from "zod";

export const procurementItemSchema = z.object({
  description: z.string().min(1, "Description is required").max(255),
  quantity:    z.number({ invalid_type_error: "Quantity is required" }).int().min(1, "Must be at least 1"),
  unit_price:  z.number().min(0).nullable().optional(),
  total_price: z.number().min(0).nullable().optional(),
});

export const procurementSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description:      z.string().max(2000).optional(),
  estimated_amount: z.number().min(0).optional(),
  currency:  z.string().default("NGN"),
  vendor_id: z.string().optional(),
  items: z
    .array(procurementItemSchema)
    .min(1, "Add at least one line item"),
});

export type ProcurementFormValues = z.infer<typeof procurementSchema>;
export type ProcurementItemFormValues = z.infer<typeof procurementItemSchema>;
