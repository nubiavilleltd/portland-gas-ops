import { z } from "zod";

export const dispatchSchema = z.object({
  driver_id: z.string().min(1, "Select driver"),
  vehicle_id: z.string().min(1, "Select vehicle"),

  dispatch_date: z.string().min(1, "Select dispatch date"),
  estimated_delivery_date: z.string().min(1, "Select estimated date"),

  delivery_status: z.enum([
    "assigned",
    "in_transit",
    "delivered",
    "failed",
  ]),

  notes: z.string().optional(),
});

export type DispatchFormValues = z.infer<typeof dispatchSchema>;