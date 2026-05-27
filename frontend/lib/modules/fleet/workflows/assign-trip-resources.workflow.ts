import { TripsService } from "../services/trips.service";

import { FLEET_KEYS } from "../constants/query-keys";
import { ORDER_KEYS } from "@/lib/modules/orders/constants/query-keys";

import type { Trip } from "../types/trip.types";

export type AssignResourcesInput = {
  tripId: string;
  driverId: string;
  vehicleId: string;
};

export async function assignResourcesWorkflow(params: {
  input: AssignResourcesInput;
  queryClient: any;
}): Promise<Trip> {
  const { input, queryClient } = params;

  // 1. ASSIGN
  const updatedTrip =
    await TripsService.assignDriverAndVehicle(
      input.tripId,
      input.driverId,
      input.vehicleId
    );

  // 2. WRITE THROUGH CACHE
  queryClient.setQueryData(
    FLEET_KEYS.trip(input.tripId),
    updatedTrip
  );

  // 3. INVALIDATE TRIPS
  queryClient.invalidateQueries({
    queryKey: FLEET_KEYS.trips,
  });

  // 4. DRIVER + VEHICLE STATUS CHANGED
  queryClient.invalidateQueries({
    queryKey: FLEET_KEYS.drivers,
  });

  queryClient.invalidateQueries({
    queryKey: FLEET_KEYS.vehicles,
  });

  // 5. ORDERS ALSO CHANGED TO ASSIGNED
  queryClient.invalidateQueries({
    queryKey: ORDER_KEYS.all,
  });

  return updatedTrip;
}