// import type { Trip } from "../types/trip.types";
// import { TripsService } from "../services/trips.service";
// import { canDispatchTrip } from "../guards/trip.guards";

// export async function dispatchTripWorkflow(trip: Trip): Promise<Trip> {
//   if (!canDispatchTrip(trip)) {
//     throw new Error("Trip cannot be dispatched in current state");
//   }

//   return TripsService.dispatchTrip(trip.id);
// }



import type { Trip } from "../types/trip.types";
import { TripsService } from "../services/trips.service";
import { canDispatchTrip } from "../guards/trip.guards";
import { dispatchInventoryWorkflow } from "./dispatch-inventory.workflow";

export async function dispatchTripWorkflow(trip: Trip): Promise<Trip> {
  if (!canDispatchTrip(trip)) {
    throw new Error("Trip cannot be dispatched in current state");
  }

  // 1. Dispatch trip — updates trip status + order fulfillment cascade
  const updatedTrip = await TripsService.dispatchTrip(trip.id);

  // 2. Inventory deductions — runs after trip is confirmed dispatched
  await dispatchInventoryWorkflow(updatedTrip);

  return updatedTrip;
}