import { TripsService } from "../services/trips.service";
import { FLEET_KEYS } from "../constants/query-keys";
import { ORDER_KEYS } from "@/lib/modules/orders/constants/query-keys";

import type { CreateTripInput, Trip } from "../types/trip.types";

export async function createTripWorkflow(params: {
  input: CreateTripInput;
  queryClient: any;
}): Promise<Trip> {
  const { input, queryClient } = params;

  // 1. CREATE TRIP
  const trip = await TripsService.createTrip(input);

  // 2. CACHE UPDATE (single trip)
  queryClient.setQueryData(
    FLEET_KEYS.trip(trip.id),
    trip
  );

  // 3. INVALIDATE TRIPS LIST
  queryClient.invalidateQueries({
    queryKey: FLEET_KEYS.trips(),
  });

  // 4. REFRESH ORDERS (because trip affects fulfillment state)
  queryClient.invalidateQueries({
    queryKey: ORDER_KEYS.lists(),
  });

  return trip;
}