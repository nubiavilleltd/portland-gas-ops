import { z } from "zod";

export const createDriverSchema = z.object({
  employee_id: z
    .string()
    .min(1, "Please select an employee"),

  license_number: z
    .string()
    .trim()
    .min(3, "License number is required")
    .max(30, "License number is too long"),

 license_expiry_date: z
    .string()
    .min(1, "License expiry date is required")
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date")
    .refine((val) => new Date(val) > new Date(), "License has already expired"),

 experience_years: z
    .string()
    .min(1, "Experience is required")
    .transform((val) => Number(val))
    .pipe(z.number()
      .min(0, "Experience cannot be negative")
      .max(70, "Please enter a realistic number of years")),

  address: z
    .string()
    .trim()
    .max(255, "Address is too long")
    .optional()
    .or(z.literal("")),
});

export const editDriverSchema = createDriverSchema.extend({
  status: z.enum(["off_duty", "suspended", "assigned", "in_transit", "available"]),
});

/**
 * RHF input types
 */
export type CreateDriverFormInput = z.input<typeof createDriverSchema>;
export type EditDriverFormInput = z.input<typeof editDriverSchema>;

/**
 * Validated output types
 */
export type CreateDriverFormData = z.output<typeof createDriverSchema>;
export type EditDriverFormData = z.output<typeof editDriverSchema>;

/**
 * Generic driver form types
 */
export type DriverFormInput =
  | CreateDriverFormInput
  | EditDriverFormInput;

export type DriverFormData =
  | CreateDriverFormData
  | EditDriverFormData;