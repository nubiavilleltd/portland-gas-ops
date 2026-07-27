// import type { Trip } from "../types/trip.types";
// import { TripsService } from "../services/trips.service";
// import { canStartTrip } from "../guards/trip.guards";
// import { AuditService } from "../../audit/services/audit.service";
// import { CURRENT_ACTOR, SYSTEM_ACTOR } from "../../audit/constants/current-actor";


// export async function startTripWorkflow(trip: Trip) {
//   if (!canStartTrip(trip)) {
//     throw new Error("Trip cannot be started in its current state");
//   }

//   const updatedTrip = await TripsService.startTrip(trip.id);

//   await AuditService.record({
//     entity_type: "trip",
//     entity_id: updatedTrip.id,
//     action: "started",
//     description: "Driver confirmed departure — trip in transit",
//     actor: CURRENT_ACTOR,
//   });

//   for (const orderId of updatedTrip.order_ids) {
//     await AuditService.record({
//       entity_type: "order",
//       entity_id: orderId,
//       action: "in_transit",
//       description: `Order in transit on trip ${updatedTrip.trip_number}`,
//       actor: SYSTEM_ACTOR,
//     });
//   }

//   return updatedTrip;
// }



import type { Trip } from "../types/trip.types";
import { TripsService } from "../services/trips.service";
import { canStartTrip } from "../guards/trip.guards";

export async function startTripWorkflow(trip: Trip): Promise<Trip> {
  if (!canStartTrip(trip)) {
    throw new Error("Trip cannot be started in its current state");
  }
  // Backend handles: status, driver/vehicle in_transit, order cascade, audit
  return TripsService.startTrip(trip.id);
}