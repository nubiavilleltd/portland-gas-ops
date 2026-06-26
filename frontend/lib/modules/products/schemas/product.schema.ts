import { z } from "zod";

export const PRODUCT_UNITS   = ["kg", "litre", "m3", "unit", "tonne"] as const;
export const PRODUCT_STATUS  = ["active", "inactive"] as const;
export const PRODUCT_TYPES   = ["consumable", "tracked"] as const;


const productSchemaBase = z.object({
  name: z.string().trim().min(1, "Product name is required"),

  product_type: z.enum(PRODUCT_TYPES, {
    message: "Select a product type",
  }),

  unit: z.enum(PRODUCT_UNITS, {
    message: "Select a unit of measurement",
  }),

  default_unit_price: z
    .string()
    .min(1, "Unit price is required")
    .transform((v) => Number(v.replace(/,/g, "")))
    .pipe(z.number().positive("Price must be positive")),

  status: z.enum(PRODUCT_STATUS).default("active"),

  description: z.string().optional(),

  code: z.string().optional(),

  minimum_stock: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v.replace(/,/g, "")) : undefined))
    .pipe(z.number().positive("Minimum stock must be positive").optional()),
});

export const createProductSchema = productSchemaBase.superRefine((data, ctx) => {
  if (data.product_type === "tracked" && !data.code) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Product code is required for tracked assets",
      path: ["code"],
    });
  }
});

export const updateProductSchema = productSchemaBase.partial();

export type CreateProductFormInput  = z.input<typeof createProductSchema>;
export type CreateProductFormOutput = z.output<typeof createProductSchema>;

export type UpdateProductFormInput  = z.input<typeof updateProductSchema>;
export type UpdateProductFormOutput = z.output<typeof updateProductSchema>;