import { TripsService } from "../services/trips.service";


import type { Trip } from "../types/trip.types";

export type AssignResourcesInput = {
  tripId: string;
  driverId: string;
  vehicleId: string;
};

export async function assignResourcesWorkflow(input: AssignResourcesInput): Promise<Trip> {

  // 1. ASSIGN
 return TripsService.assignDriverAndVehicle(
    input.tripId,
    input.driverId,
    input.vehicleId
  );
}