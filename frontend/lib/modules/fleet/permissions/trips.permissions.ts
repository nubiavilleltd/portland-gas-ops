
import { User } from "@/types";
import { Trip } from "../types/trip.types";




export function canCurrentUserConfirmDelivery(
  user: User | null,
  trip: Trip | undefined,
) {
    if(!user || !trip) return false

  if (
    user.role === "admin" ||
    user.role === "super_admin"
  ) {
    return true;
  }

  // Assigned driver
  return trip.driver_id === user.driver?.id;
}