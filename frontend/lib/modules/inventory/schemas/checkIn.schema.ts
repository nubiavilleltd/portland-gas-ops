import { z } from "zod";

export const CONDITION_VALUES = ["new", "used", "refurbished", "damaged"] as const;
export const DISPOSITION_VALUES = ["sold", "loaned", "rented"] as const;

// ── Tracked check-in ─────────────────────────────────────
export const checkInTrackedSchema = z.object({
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

// ── Consumable check-in ──────────────────────────────────
export const checkInConsumableSchema = z.object({
  product_id: z.string().min(1, "Select a product"),
  location_id: z.string().min(1, "Select a location"),
  quantity: z
    .string()
    .min(1, "Enter a quantity")
    .transform((v) => parseFloat(v.replace(/,/g, "")))
    .pipe(z.number().positive("Quantity must be greater than 0")),
  notes: z.string().optional(),
});

// ── Types ────────────────────────────────────────────────
export type CheckInTrackedFormInput  = z.input<typeof checkInTrackedSchema>;
export type CheckInTrackedFormOutput = z.output<typeof checkInTrackedSchema>;

export type CheckInConsumableFormInput  = z.input<typeof checkInConsumableSchema>;
export type CheckInConsumableFormOutput = z.output<typeof checkInConsumableSchema>;