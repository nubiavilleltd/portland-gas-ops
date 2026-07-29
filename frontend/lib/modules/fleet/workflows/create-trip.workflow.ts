
import { TripsService } from "../services/trips.service";
import type { CreateTripInput, Trip } from "../types/trip.types";
import { canCreateTrip } from "../guards/trip.guards";

export async function createTripWorkflow(input: CreateTripInput): Promise<Trip> {
  if (!canCreateTrip()) {
    throw new Error("Trip cannot be created");
  }
  const order_ids = input.type === "order_delivery" ? (input.order_ids ?? []) : [];
  // Backend handles all audit entries and cascades atomically
  return TripsService.createTrip({ ...input, order_ids });
}