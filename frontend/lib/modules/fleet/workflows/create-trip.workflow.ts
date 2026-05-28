import { TripsService } from "../services/trips.service";
import { FLEET_KEYS } from "../constants/query-keys";
import { ORDER_KEYS } from "@/lib/modules/orders/constants/query-keys";

import type { CreateTripInput, Trip } from "../types/trip.types";
import { canCreateTrip } from "../guards/trip.guards";



// export async function createTripWorkflow(input: CreateTripInput): Promise<Trip> {
//   if (!canCreateTrip()) {
//     throw new Error("Trip cannot be created");
//   }

//   return TripsService.createTrip(input);
// }



export async function createTripWorkflow(input: CreateTripInput): Promise<Trip> {
  if (!canCreateTrip()) {
    throw new Error("Trip cannot be created");
  }

  // Only link orders for order_delivery trips
  const order_ids =
    input.type === "order_delivery" ? (input.order_ids ?? []) : [];

  return TripsService.createTrip({ ...input, order_ids });
}