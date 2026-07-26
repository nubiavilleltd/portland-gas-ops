
import { User } from "@/types";
import { Order } from "../../orders/types/orders.types";
import { Trip } from "../types/trip.types";


export function canCurrentUserConfirmDelivery(
  user: User,
  trip: Trip,
  order: Order,
) {
  // Business state
  if (
    order.orderStatus !== "confirmed" ||
    order.fulfillmentStatus !== "in_transit"
  ) {
    return false;
  }

  // Admins
  if (user.role === "admin" || user.role === "super_admin") {
    return true;
  }

  // Assigned driver
  return trip.driver_id === user.employeeId;
}