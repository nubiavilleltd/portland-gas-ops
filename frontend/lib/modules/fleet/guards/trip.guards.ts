import type { Trip } from "../types/trip.types";
import type { Driver } from "../types/driver.types";
import type { Vehicle } from "../types/vehicle.types";
import { Order } from "../../orders/types/orders.types";

export function canCreateTrip(): boolean {
  // later you may add role checks, etc.
  return true;
}

export function canLinkOrderToTrip(order: Order): boolean {
  return (
    order.order_status === "confirmed" &&
    order.fulfillment_status === "pending"
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

export function canAssignResourcesToTrip(
  trip: Trip | undefined
) {
  if (!trip) return false;

  return (
    trip.status === "pending" &&
    !trip.driver_id &&
    !trip.vehicle_id
  );
}


// ─────────────────────────────────────────────
// FULL RESOURCE ASSIGNMENT
// ─────────────────────────────────────────────

export function canAssignResources(params: {
  trip: Trip | undefined;
  driver: Driver | undefined;
  vehicle: Vehicle | undefined;
}) {
  const {
    trip,
    driver,
    vehicle,
  } = params;

  return (
    canAssignResourcesToTrip(trip) &&
    canAssignDriver(driver) &&
    canAssignVehicle(vehicle)
  );
}



export function canDispatchTrip(trip: Trip) {
  return trip.status === "assigned";
}

export function canStartTrip(trip: Trip) {
  return trip.status === "dispatched" || trip.status === "assigned";
}