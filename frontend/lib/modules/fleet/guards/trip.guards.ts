import type { Trip } from "../types/trip.types";

export function canCreateTrip(): boolean {
  // later you may add role checks, etc.
  return true;
}

export function canLinkOrderToTrip(order: any): boolean {
  return (
    order.order_status === "confirmed" &&
    order.fulfillment_status === "pending"
  );
}