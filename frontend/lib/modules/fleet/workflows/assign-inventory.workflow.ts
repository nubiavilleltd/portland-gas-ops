import { TripsService } from "../services/trips.service";
import { OrdersService } from "../../orders/services/orders.service";
import { reserveItemsWorkflow } from "../../inventory/workflows/reserve.workflow";
import { canAssignInventory } from "../guards/trip.guards";
import type { Trip } from "../types/trip.types";
import type { ItemDisposition } from "@/lib/modules/inventory/types/inventory.types";
import { AuditService } from "../../audit/services/audit.service";
import { CURRENT_ACTOR, SYSTEM_ACTOR } from "../../audit/constants/current-actor";

export type InventoryAssignment = {
    orderId: string;
    productId: string;
    itemIds: string[];
    disposition: ItemDisposition
};

export type AssignInventoryInput = {
    trip: Trip;
    assignments: InventoryAssignment[];
};

// export async function assignInventoryWorkflow(
//   input: AssignInventoryInput
// ): Promise<Trip> {
//   if (!canAssignInventory(input.trip)) {
//     throw new Error("Inventory cannot be assigned to this trip");
//   }

//   // 1. Reserve items and update order line items
//   for (const assignment of input.assignments) {
//     await reserveItemsWorkflow({
//       item_ids: assignment.itemIds,
//       order_id: assignment.orderId,
//       recorded_by: "Warehouse Staff",
//     });

//     await OrdersService.updateOrderLineItem(
//       assignment.orderId,
//       assignment.productId,
//       assignment.itemIds,
//       assignment.disposition,
//     );
//   }

//   // 2. Mark trip as ready
//   return TripsService.setReady(input.trip.id);
// }




export async function assignInventoryWorkflow(
    input: AssignInventoryInput
): Promise<Trip> {
    if (!canAssignInventory(input.trip)) {
        throw new Error("Inventory cannot be assigned to this trip");
    }

    let totalUnits = 0;

    for (const assignment of input.assignments) {
        await reserveItemsWorkflow({
            item_ids: assignment.itemIds,
            order_id: assignment.orderId,
            recorded_by: "Warehouse Staff",
        });

        await OrdersService.updateOrderLineItem(
            assignment.orderId,
            assignment.productId,
            assignment.itemIds,
            assignment.disposition,
        );

        totalUnits += assignment.itemIds.length;
    }

    await AuditService.record({
        entity_type: "trip",
        entity_id: input.trip.id,
        action: "inventory_assigned",
        description: `Tracked items assigned — ${totalUnits} unit(s) reserved`,
        actor: CURRENT_ACTOR,
    });

    const readyTrip = await TripsService.setReady(input.trip.id);

    await AuditService.record({
        entity_type: "trip",
        entity_id: readyTrip.id,
        action: "marked_ready",
        description: "Trip marked ready for dispatch",
        actor: SYSTEM_ACTOR,
    });

    return readyTrip;
}