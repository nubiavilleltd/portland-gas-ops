// // lib/modules/fleet/workflows/complete-trip.workflow.ts

// import type { Trip } from "../types/trip.types";
// import { TripsService } from "../services/trips.service";
// import { canCompleteTrip } from "../guards/trip.guards";
// import { AuditService } from "../../audit/services/audit.service";
// import { CURRENT_ACTOR } from "../../audit/constants/current-actor";

// export type CompleteTripInput = {
//   trip: Trip;
//   proofNotes?: string;
// };

// export async function completeTripWorkflow(input: CompleteTripInput): Promise<Trip> {
//   if (!canCompleteTrip(input.trip)) {
//     throw new Error("Trip cannot be completed in its current state");
//   }

//   const completed = await TripsService.completeTrip(input.trip.id, input.proofNotes);

//   await AuditService.record({
//     entity_type: "trip",
//     entity_id: completed.id,
//     action: "completed",
//     description: "Trip completed — all deliveries confirmed",
//     actor: CURRENT_ACTOR,
//   });

//   return completed;
// }




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
  // Backend handles: validates all orders completed, releases driver/vehicle, audit
  return TripsService.completeTrip(input.trip.id, input.proofNotes);
}