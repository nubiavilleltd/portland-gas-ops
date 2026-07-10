// import { TripsService } from "../services/trips.service";
// import { OrdersService } from "../../orders/services/orders.service";
// import { reserveItemsWorkflow } from "../../inventory/workflows/reserve.workflow";
// import { canAssignInventory } from "../guards/trip.guards";
// import type { Trip } from "../types/trip.types";
// import type { ItemDisposition } from "@/lib/modules/inventory/types/inventory.types";
// import { AuditService } from "../../audit/services/audit.service";
// import { CURRENT_ACTOR, SYSTEM_ACTOR } from "../../audit/constants/current-actor";

// export type InventoryAssignment = {
//     orderId: string;
//     productId: string;
//     itemIds: string[];
//     disposition: ItemDisposition
// };

// export type AssignInventoryInput = {
//     trip: Trip;
//     assignments: InventoryAssignment[];
// };


// export async function assignInventoryWorkflow(
//     input: AssignInventoryInput
// ): Promise<Trip> {
//     if (!canAssignInventory(input.trip)) {
//         throw new Error("Inventory cannot be assigned to this trip");
//     }

//     let totalUnits = 0;

//     for (const assignment of input.assignments) {
//         await reserveItemsWorkflow({
//             item_ids: assignment.itemIds,
//             order_id: assignment.orderId,
//             recorded_by: "Warehouse Staff",
//         });

//         await OrdersService.updateOrderLineItem(
//             assignment.orderId,
//             assignment.productId,
//             assignment.itemIds,
//             assignment.disposition,
//         );

//         totalUnits += assignment.itemIds.length;
//     }

//     await AuditService.record({
//         entity_type: "trip",
//         entity_id: input.trip.id,
//         action: "inventory_assigned",
//         description: `Tracked items assigned — ${totalUnits} unit(s) reserved`,
//         actor: CURRENT_ACTOR,
//     });

//     const readyTrip = await TripsService.setReady(input.trip.id);

//     await AuditService.record({
//         entity_type: "trip",
//         entity_id: readyTrip.id,
//         action: "marked_ready",
//         description: "Trip marked ready for dispatch",
//         actor: SYSTEM_ACTOR,
//     });

//     return readyTrip;
// }




import { TripsService } from "../services/trips.service";
import type { Trip } from "../types/trip.types";
import { canAssignInventory } from "../guards/trip.guards";

export type InventoryAssignment = {
  orderId: string;
  productId: string;
  itemIds: string[];
  disposition: string;
};

export type AssignInventoryInput = {
  trip: Trip;
  assignments: InventoryAssignment[];
};

export async function assignInventoryWorkflow(input: AssignInventoryInput): Promise<Trip> {
  if (!canAssignInventory(input.trip)) {
    throw new Error("Inventory cannot be assigned to this trip");
  }
  // Backend mark-ready endpoint — inventory is already tracked via order_item_inventory
  // The assignment page sends item selections to the backend which updates order_item_inventory
  // then marks the trip ready
  return TripsService.setReady(input.trip.id);
}