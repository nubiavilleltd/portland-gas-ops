// import { trips } from "../mock/trips.mock";

// export function getTrips() {
//   return trips;
// }

// export function getTripById(id: string) {
//   return trips.find((trip) => trip.id === id);
// }

// export function getTripsByDriver(driverId: string) {
//   return trips.filter((trip) => trip.driver_id === driverId);
// }

// export function getActiveTripByDriver(driverId: string) {
//   return trips.find(
//     (trip) =>
//       trip.driver_id === driverId &&
//       (trip.status === "assigned" || trip.status === "in_transit")
//   );
// }

// export function getTripsByVehicle(vehicleId: string) {
//   return trips.filter((trip) => trip.vehicle_id === vehicleId);
// }




import { trips } from "../mock/trips.mock";
import type { Trip, TripStatus } from "../types/trip.types";

export function getTrips(): Trip[] {
  return trips;
}

export function getTripById(id: string): Trip | undefined {
  return trips.find((trip) => trip.id === id);
}

export function getTripsByStatus(status: TripStatus): Trip[] {
  return trips.filter((trip) => trip.status === status);
}

export function getTripsByDriver(driverId: string): Trip[] {
  return trips.filter((trip) => trip.driver_id === driverId);
}

export function getActiveTripByDriver(driverId: string): Trip | undefined {
  return trips.find(
    (trip) =>
      trip.driver_id === driverId &&
      (trip.status === "assigned" ||
        trip.status === "dispatched" ||
        trip.status === "in_transit")
  );
}

export function getTripsByVehicle(vehicleId: string): Trip[] {
  return trips.filter((trip) => trip.vehicle_id === vehicleId);
}

export function getActiveTrips(): Trip[] {
  return trips.filter((t) =>
    ["assigned", "dispatched", "in_transit"].includes(t.status)
  );
}

export function getPendingTrips(): Trip[] {
  return trips.filter((t) => t.status === "pending");
}