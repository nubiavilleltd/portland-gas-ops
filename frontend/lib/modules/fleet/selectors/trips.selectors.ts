// // import { trips } from "../mock/trips.mock";

// // export function getTrips() {
// //   return trips;
// // }

// // export function getTripById(id: string) {
// //   return trips.find((trip) => trip.id === id);
// // }

// // export function getTripsByDriver(driverId: string) {
// //   return trips.filter((trip) => trip.driver_id === driverId);
// // }

// // export function getActiveTripByDriver(driverId: string) {
// //   return trips.find(
// //     (trip) =>
// //       trip.driver_id === driverId &&
// //       (trip.status === "assigned" || trip.status === "in_transit")
// //   );
// // }

// // export function getTripsByVehicle(vehicleId: string) {
// //   return trips.filter((trip) => trip.vehicle_id === vehicleId);
// // }




// import { trips } from "../mock/trips.mock";
// import type { Trip, TripStatus } from "../types/trip.types";

// export function getTrips(): Trip[] {
//   return trips;
// }

// export function getTripById(id: string): Trip | undefined {
//   return trips.find((trip) => trip.id === id);
// }

// export function getTripsByStatus(status: TripStatus): Trip[] {
//   return trips.filter((trip) => trip.status === status);
// }

// export function getTripsByDriver(driverId: string): Trip[] {
//   return trips.filter((trip) => trip.driver_id === driverId);
// }

// export function getActiveTripByDriver(driverId: string): Trip | undefined {
//   return trips.find(
//     (trip) =>
//       trip.driver_id === driverId &&
//       (trip.status === "assigned" ||
//         trip.status === "dispatched" ||
//         trip.status === "in_transit")
//   );
// }

// export function getTripsByVehicle(vehicleId: string): Trip[] {
//   return trips.filter((trip) => trip.vehicle_id === vehicleId);
// }

// export function getActiveTrips(): Trip[] {
//   return trips.filter((t) =>
//     ["assigned", "dispatched", "in_transit"].includes(t.status)
//   );
// }

// export function getPendingTrips(): Trip[] {
//   return trips.filter((t) => t.status === "pending");
// }






// ============================================================
//  TRIPS SELECTORS
//  Pure functions. No imports from mock files. No side effects.
//
//  TODAY:   called with data from useTrips() hook
//  FUTURE:  called via select: in useQuery — nothing changes here
// ============================================================

import type { Trip, TripStatus } from "@/lib/modules/fleet/types/trip.types";

export function getTripById(
  trips: Trip[],
  id: string
): Trip | undefined {
  return trips.find((t) => t.id === id);
}

export function getTripsByStatus(
  trips: Trip[],
  status: TripStatus
): Trip[] {
  return trips.filter((t) => t.status === status);
}

export function getTripsByDriver(
  trips: Trip[],
  driverId: string
): Trip[] {
  return trips.filter((t) => t.driver_id === driverId);
}

export function getTripsByVehicle(
  trips: Trip[],
  vehicleId: string
): Trip[] {
  return trips.filter((t) => t.vehicle_id === vehicleId);
}

export function getActiveTripByDriver(
  trips: Trip[],
  driverId: string
): Trip | undefined {
  return trips.find(
    (t) =>
      t.driver_id === driverId &&
      (t.status === "assigned" ||
        t.status === "dispatched" ||
        t.status === "in_transit")
  );
}

export function getActiveTrips(trips: Trip[]): Trip[] {
  return trips.filter((t) =>
    ["assigned", "dispatched", "in_transit"].includes(t.status)
  );
}

export function getPendingTrips(trips: Trip[]): Trip[] {
  return trips.filter((t) => t.status === "pending");
}