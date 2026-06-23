import type { Trip } from "../types/trip.types";
import { TripsService } from "../services/trips.service";
import { canDispatchTrip } from "../guards/trip.guards";
import { dispatchInventoryWorkflow } from "./dispatch-inventory.workflow";
import { AuditService } from "../../audit/services/audit.service";
import { CURRENT_ACTOR, SYSTEM_ACTOR } from "../../audit/constants/current-actor";

// export async function dispatchTripWorkflow(trip: Trip): Promise<Trip> {
//   if (!canDispatchTrip(trip)) {
//     throw new Error("Trip cannot be dispatched in current state");
//   }

//   // 1. Dispatch trip — updates trip status + order fulfillment cascade
//   const updatedTrip = await TripsService.dispatchTrip(trip.id);

//   // 2. Inventory deductions — runs after trip is confirmed dispatched
//   await dispatchInventoryWorkflow(updatedTrip);

//   return updatedTrip;
// }




export async function dispatchTripWorkflow(trip: Trip): Promise<Trip> {
  if (!canDispatchTrip(trip)) {
    throw new Error("Trip cannot be dispatched in current state");
  }

  const updatedTrip = await TripsService.dispatchTrip(trip.id);
  await dispatchInventoryWorkflow(updatedTrip);

  await AuditService.record({
    entity_type: "trip",
    entity_id: updatedTrip.id,
    action: "dispatched",
    description: `Trip dispatched with ${updatedTrip.order_ids.length} order(s)`,
    actor: CURRENT_ACTOR,
  });

  for (const orderId of updatedTrip.order_ids) {
    await AuditService.record({
      entity_type: "order",
      entity_id: orderId,
      action: "dispatched",
      description: `Order dispatched on trip ${updatedTrip.trip_number}`,
      actor: SYSTEM_ACTOR,
    });
  }

  return updatedTrip;
}