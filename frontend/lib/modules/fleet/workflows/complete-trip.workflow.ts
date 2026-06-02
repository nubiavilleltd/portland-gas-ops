// lib/modules/fleet/workflows/complete-trip.workflow.ts

import type { Trip } from "../types/trip.types";
import { TripsService } from "../services/trips.service";
import { canCompleteTrip } from "../guards/trip.guards";

export type CompleteTripInput = {
  trip: Trip;
  proofNotes?: string;
};

export async function completeTripWorkflow(input: CompleteTripInput): Promise<Trip> {
  if (!canCompleteTrip(input.trip)) {
    throw new Error("Trip cannot be completed in its current state");
  }

  return TripsService.completeTrip(input.trip.id, input.proofNotes);
}