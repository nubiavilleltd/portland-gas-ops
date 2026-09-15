import { z } from "zod";

export const CONDITION_VALUES = [
  "new",
  "used",
  "refurbished",
  "damaged",
] as const;

export const DISPOSITION_VALUES = ["sold", "loaned"] as const;

// ── Individual items check-in ─────────────────────────────
export const checkInIndividualItemsSchema = z.object({
  product_id: z.string().min(1, "Select a product"),
  location_id: z.string().min(1, "Select a location"),
  quantity: z
    .string()
    .min(1, "Enter a quantity")
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().positive("Quantity must be at least 1")),
  condition: z.enum(CONDITION_VALUES, { message: "Select a condition" }),
  notes: z.string().optional(),
});

// ── Stock quantity check-in ───────────────────────────────
export const checkInStockQuantitySchema = z.object({
  product_id: z.string().min(1, "Select a product"),
  location_id: z.string().min(1, "Select a location"),
  quantity: z
    .string()
    .min(1, "Enter a quantity")
    .transform((v) => parseFloat(v.replace(/,/g, "")))
    .pipe(z.number().positive("Quantity must be greater than 0")),
  notes: z.string().optional(),
});

// ── Types ─────────────────────────────────────────────────
export type CheckInIndividualItemsFormInput = z.input<
  typeof checkInIndividualItemsSchema
>;
export type CheckInIndividualItemsFormOutput = z.output<
  typeof checkInIndividualItemsSchema
>;

export type CheckInStockQuantityFormInput = z.input<
  typeof checkInStockQuantitySchema
>;
export type CheckInStockQuantityFormOutput = z.output<
  typeof checkInStockQuantitySchema
>;