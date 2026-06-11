import { TripsService } from "../services/trips.service";
import { OrdersService } from "../../orders/services/orders.service";
import { reserveItemsWorkflow } from "../../inventory/workflows/reserve.workflow";
import { canAssignInventory } from "../guards/trip.guards";
import type { Trip } from "../types/trip.types";

export type InventoryAssignment = {
  orderId: string;
  productId: string;
  itemIds: string[];
};

export type AssignInventoryInput = {
  trip: Trip;
  assignments: InventoryAssignment[];
};

export async function assignInventoryWorkflow(
  input: AssignInventoryInput
): Promise<Trip> {
  if (!canAssignInventory(input.trip)) {
    throw new Error("Inventory cannot be assigned to this trip");
  }

  // 1. Reserve items and update order line items
  for (const assignment of input.assignments) {
    await reserveItemsWorkflow({
      item_ids: assignment.itemIds,
      order_id: assignment.orderId,
      recorded_by: "Warehouse Staff",
    });

    await OrdersService.updateOrderLineItem(
      assignment.orderId,
      assignment.productId,
      assignment.itemIds
    );
  }

  // 2. Mark trip as ready
  return TripsService.setReady(input.trip.id);
}