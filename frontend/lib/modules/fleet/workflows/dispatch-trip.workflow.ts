import type { Trip } from "../types/trip.types";
import { TripsService } from "../services/trips.service";
import { canDispatchTrip } from "../guards/trip.guards";

export async function dispatchTripWorkflow(trip: Trip): Promise<Trip> {
  if (!canDispatchTrip(trip)) {
    throw new Error("Trip cannot be dispatched in current state");
  }
  // Backend handles: status, order fulfillment, inventory checkout, audit
  return TripsService.dispatchTrip(trip.id);
}