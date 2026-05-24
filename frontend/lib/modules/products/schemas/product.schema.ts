import { z } from "zod";

export const PRODUCT_UNITS  = ["kg", "litre", "m3", "unit", "tonne"] as const;
export const PRODUCT_STATUS = ["active", "inactive"] as const;

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "Product name is required"),
  unit: z.enum(PRODUCT_UNITS, {
    message: "Select a unit of measurement",
  }),
  default_unit_price: z
  .string()
  .min(1, "Unit price is required")
  .transform((v) => Number(v.replace(/,/g, "")))  // strip commas before converting
  .pipe(z.number().positive("Price must be positive")),
  status: z.enum(PRODUCT_STATUS).default("active"),
  description: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();

// ── z.input  = what the form fields hold (string for price) ──
// ── z.output = what onSubmit receives after transform (number) ──
export type CreateProductFormInput  = z.input<typeof createProductSchema>;
export type CreateProductFormOutput = z.output<typeof createProductSchema>;

export type UpdateProductFormInput  = z.input<typeof updateProductSchema>;
export type UpdateProductFormOutput = z.output<typeof updateProductSchema>;