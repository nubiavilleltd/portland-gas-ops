import { z } from "zod";

const TRIP_TYPES = [
  "order_delivery",
  "maintenance",
  "inspection",
  "station_transfer",
  "emergency",
] as const;

export const createTripSchema = z.object({
  type: z.enum(TRIP_TYPES, { message: "Select a trip type" }),

  /**
   * Populated when type === "order_delivery" and no orderId in the URL.
   * Optional because the orderId can come from the query string.
   */
  linked_order_id: z.string().optional(),

  start_location: z
    .string()
    .min(2, "Enter a start location")
    .max(200, "Location too long"),

  end_location: z
    .string()
    .min(2, "Enter a destination")
    .max(200, "Location too long"),

  scheduled_date: z.string().min(1, "Select a scheduled date"),

  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

export type CreateTripFormData = z.infer<typeof createTripSchema>;