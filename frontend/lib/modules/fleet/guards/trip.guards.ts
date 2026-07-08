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
  return trip.status === "assigned" || trip.status === "ready";
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

export function canCompleteTrip(trip: Trip): boolean {
  return trip.status === "in_transit" 
}

export function canCancelTrip(trip: Trip): boolean {
  const cancellableStatuses: TripStatus[] = [
    "pending", "assigned", "awaiting_inventory", "ready"
  ];
  return cancellableStatuses.includes(trip.status);
}


