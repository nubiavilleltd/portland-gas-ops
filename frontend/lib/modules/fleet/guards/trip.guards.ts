import type { Trip, TripStatus } from "../types/trip.types";
import type { Driver } from "../types/driver.types";
import type { Vehicle } from "../types/vehicle.types";
import { Order } from "../../orders/types/orders.types";

export function canCreateTrip(): boolean {
  // later you may add role checks, etc.
  return true;
}

export function canLinkOrderToTrip(order: Order): boolean {
  return (
    order.orderStatus === "confirmed" &&
    order.fulfillmentStatus === "pending"
  );
}




// ─────────────────────────────────────────────
// DRIVER
// ─────────────────────────────────────────────

export function canAssignDriver(
  driver: Driver | undefined
) {
  if (!driver) return false;

  return driver.status === "available";
}


// ─────────────────────────────────────────────
// VEHICLE
// ─────────────────────────────────────────────

export function canAssignVehicle(
  vehicle: Vehicle | undefined
) {
  if (!vehicle) return false;

  return vehicle.status === "available";
}


// ─────────────────────────────────────────────
// TRIP
// ─────────────────────────────────────────────



export function canAssignResourcesToTrip(trip: Trip | undefined) {
  if (!trip) return false;
  return trip.status === "pending";  // only show before first assignment
}


// ─────────────────────────────────────────────
// FULL RESOURCE ASSIGNMENT
// ─────────────────────────────────────────────

export function canDispatchTrip(trip: Trip): boolean {
  return trip.status === "assigned" || trip.status === "ready_for_dispatch";
}


export function canAssignInventory(trip: Trip): boolean {
  return (
    trip.status === "awaiting_inventory" &&
    trip.type === "order_delivery"
  );
}



export function canStartTrip(trip: Trip) {
  return trip.status === "dispatched"
}

export function canCompleteTrip(
  trip: Trip,
  orders: Map<string, Order>
): boolean {
  if (trip.status !== "in_transit") {
    return false;
  }

  if (trip.order_ids.length === 0) {
    return true;
  }


  return trip.order_ids.every((id) => {
    const order = orders.get(id);

    return (
      order &&
      order.fulfillmentStatus === "delivered"
    );
  });
}

export function canCancelTrip(trip: Trip): boolean {
  const cancellableStatuses: TripStatus[] = [
    "pending", "assigned", "awaiting_inventory", "ready_for_dispatch"
  ];
  return cancellableStatuses.includes(trip.status);
}


