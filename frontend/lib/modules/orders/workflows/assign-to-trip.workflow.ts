// workflows/assign-to-trip.workflow.ts

import type { Order } from "../types/orders.types";
import { OrdersService } from "../services/orders.service";
import { canAssignToTrip, canTransition } from "../guards/orders.guards";

export async function assignToTripWorkflow(
  order: Order,
  tripId: string
) {
  // 1. GUARD CHECK (business rule)
  if (!canAssignToTrip(order)) {
    throw new Error("Order cannot be assigned to a trip");
  }

  // 2. TRANSITION CHECK (state machine)
  if (!canTransition(order, "assigned")) {
    throw new Error("Invalid order transition to assigned");
  }

  // 3. EXECUTE SIDE EFFECT
  return OrdersService.assignToTrip(order.id, tripId);
}