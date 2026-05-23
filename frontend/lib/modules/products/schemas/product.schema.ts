
import { z } from "zod";

export const PRODUCT_UNITS = ["kg", "litre", "m3", "unit", "tonne"] as const;
export const PRODUCT_STATUS = ["active", "inactive"] as const;

/**
 * FORM INPUT (what RHF uses)
 * EVERYTHING is string here
 */
export const createProductSchema = z.object({
  name: z.string().trim().min(1, "Product name is required"),

  unit: z.enum(PRODUCT_UNITS, {
    message: "Select a unit of measurement",
  }),

  default_unit_price: z
    .string()
    .min(1, "Unit price is required")
    .transform((v) => Number(v))
    .pipe(z.number().positive("Price must be positive")),

  status: z.enum(PRODUCT_STATUS).default("active"),

  description: z.string().optional(),
});

/**
 * TYPES
 */
export type CreateProductFormInput = z.infer<typeof createProductSchema>;
