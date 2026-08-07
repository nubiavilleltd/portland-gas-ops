// lib/modules/fleet/schemas/vehicle.schema.ts

import { z } from "zod";

const VEHICLE_TYPES = [
  "lpg_tanker",
  "delivery_van",
  "service_truck",
  "emergency_unit",
] as const;

export const vehicleSchema = z
  .object({
    name: z.string().trim().min(1, "Vehicle name is required"),

    plate_number: z.string().trim().min(1, "Plate number is required"),

    type: z.enum(VEHICLE_TYPES),

    make: z.string().trim().min(1, "Make is required"),

    model: z.string().trim().min(1, "Model is required"),

    year: z
      .string()
      .min(1, "Year is required")
      .transform((val) => Number(val))
      .pipe(
        z
          .number()
          .min(1980, "Please enter a realistic year")
          .max(new Date().getFullYear() + 1, "Year cannot be in the future"),
      ),

    capacity: z
      .string()
      .optional()
      .transform((val) => (val ? Number(val) : undefined))
      .pipe(z.number().min(0, "Capacity cannot be negative").optional()),

    fuel_type: z.string().min(1, "Please select a fuel type"),

    mileage: z
      .string()
      .optional()
      .transform((val) => (val ? Number(val) : undefined))
      .pipe(z.number().min(0, "Mileage cannot be negative").optional()),

    last_service_date: z
      .string()
      .min(1, "Last service date is required")
      .refine((val) => !isNaN(Date.parse(val)), "Invalid date")
      .refine(
        (val) => new Date(val) <= new Date(),
        "Last service date cannot be in the future",
      ),

    next_service_date: z
  .string()
  .min(1, "Next service date is required")
  .refine((val) => !isNaN(Date.parse(val)), "Invalid date")
  .refine(
    (val) => val >= new Date().toISOString().split("T")[0],
    "Next service date cannot be in the past",
  ),

    insurance_expiry_date: z
      .string()
      .min(1, "Insurance expiry date is required")
      .refine((val) => !isNaN(Date.parse(val)), "Invalid date"),

    roadworthiness_expiry_date: z
      .string()
      .min(1, "Roadworthiness expiry date is required")
      .refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  })
  .refine(
    (data) =>
      new Date(data.next_service_date) >= new Date(data.last_service_date),
    {
      message: "Next service date must be after the last service date",
      path: ["next_service_date"],
    },
  );

/**
 * RHF input type (pre-validation, what the form fields hold)
 */
export type VehicleFormInput = z.input<typeof vehicleSchema>;

/**
 * Validated output type (post-validation, what onSubmit receives)
 */
export type VehicleFormData = z.output<typeof vehicleSchema>;
