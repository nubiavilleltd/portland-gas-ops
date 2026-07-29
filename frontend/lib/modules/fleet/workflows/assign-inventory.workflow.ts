import { TripsService } from "../services/trips.service";
import type { Trip } from "../types/trip.types";
import { canAssignInventory } from "../guards/trip.guards";
import { InventoryAssignment } from "../../inventory/types/inventory.types";



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
 return TripsService.setReady(
    input.trip.id,
    input.assignments,
);
}