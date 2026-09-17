import { z } from "zod";

export const INVENTORY_TRACKING = [
  "INDIVIDUAL_ITEMS",
  "STOCK_QUANTITY",
] as const;

export const PRODUCT_STATUS = ["active", "inactive"] as const;

const productSchemaBase = z.object({
  name: z.string().trim().min(1, "Product name is required"),

  categoryId: z.string().min(1, "Select a category"),

  unitId: z.string().min(1, "Select a unit of measurement"),

  inventoryTracking: z.enum(INVENTORY_TRACKING, {
    message: "Select an inventory tracking mode",
  }),

  defaultUnitPrice: z
    .string()
    .min(1, "Unit price is required")
    .transform((v) => Number(v.replace(/,/g, "")))
    .pipe(z.number().positive("Price must be positive")),

  status: z.enum(PRODUCT_STATUS).default("active"),

  description: z.string().trim().optional(),

  // SKU — optional
  code: z.string().trim().optional(),

  // Tag prefix — required for INDIVIDUAL_ITEMS, must be empty for STOCK_QUANTITY
  tagPrefix: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .optional(),

  minimumStock: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v.replace(/,/g, "")) : undefined))
    .pipe(
      z.number().nonnegative("Minimum stock cannot be negative").optional(),
    ),
});

export const createProductSchema = productSchemaBase.superRefine(
  (data, ctx) => {
    if (data.inventoryTracking === "INDIVIDUAL_ITEMS") {
      if (!data.tagPrefix || data.tagPrefix.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Tag prefix is required for individually-tracked products",
          path: ["tagPrefix"],
        });
      }
    } else {
      if (data.tagPrefix && data.tagPrefix.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Tag prefix must not be set for stock-quantity products",
          path: ["tagPrefix"],
        });
      }
    }
  },
);

export const updateProductSchema = productSchemaBase.partial();

export type CreateProductFormInput = z.input<typeof createProductSchema>;
export type CreateProductFormOutput = z.output<typeof createProductSchema>;

export type UpdateProductFormInput = z.input<typeof updateProductSchema>;
export type UpdateProductFormOutput = z.output<typeof updateProductSchema>;