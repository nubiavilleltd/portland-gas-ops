import type { Trip } from "../types/trip.types";
import { TripsService } from "../services/trips.service";
import { canStartTrip } from "../guards/trip.guards";

export async function startTripWorkflow(trip: Trip) {
  if (!trip) {
    throw new Error("Trip not loaded");
  }

  // 🛑 Guard: business rule validation
  if (!canStartTrip(trip)) {
    throw new Error("Trip cannot be started in its current state");
  }

  // 🚀 Delegate to service
  return TripsService.startTrip(trip.id);
}