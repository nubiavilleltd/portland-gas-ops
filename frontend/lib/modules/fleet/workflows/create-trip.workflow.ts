// import { TripsService } from "../services/trips.service";
// import { FLEET_KEYS } from "../constants/query-keys";
// import { ORDER_KEYS } from "@/lib/modules/orders/constants/query-keys";

// import type { CreateTripInput, Trip } from "../types/trip.types";
// import { canCreateTrip } from "../guards/trip.guards";
// import { AuditService } from "../../audit/services/audit.service";
// import { CURRENT_ACTOR } from "../../audit/constants/current-actor";

// // export async function createTripWorkflow(input: CreateTripInput): Promise<Trip> {
// //   if (!canCreateTrip()) {
// //     throw new Error("Trip cannot be created");
// //   }

// //   // Only link orders for order_delivery trips
// //   const order_ids =
// //     input.type === "order_delivery" ? (input.order_ids ?? []) : [];

// //   return TripsService.createTrip({ ...input, order_ids });
// // }




// export async function createTripWorkflow(input: CreateTripInput): Promise<Trip> {
//   if (!canCreateTrip()) {
//     throw new Error("Trip cannot be created");
//   }

//   const order_ids = input.type === "order_delivery" ? (input.order_ids ?? []) : [];
//   const trip = await TripsService.createTrip({ ...input, order_ids });

//   await AuditService.record({
//     entity_type: "trip",
//     entity_id: trip.id,
//     action: "created",
//     description: `Trip created${order_ids.length > 0 ? ` for ${order_ids.length} order(s)` : " (orderless)"}`,
//     actor: CURRENT_ACTOR,
//   });

//   // Cascade to each linked order
//   for (const orderId of order_ids) {
//     await AuditService.record({
//       entity_type: "order",
//       entity_id: orderId,
//       action: "assigned_to_trip",
//       description: `Order assigned to trip ${trip.trip_number}`,
//       actor: CURRENT_ACTOR,
//     });
//   }

//   return trip;
// }





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