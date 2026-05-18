// import { trips } from "../mock/trips.mock";

// export function getTrips() {
//   return trips;
// }

// export function getTripById(id: string) {
//   return trips.find(
//     (trip) => trip.id === id
//   );
// }



import { trips } from "../mock/trips.mock";

export function getTrips() {
  return trips;
}

export function getTripById(id: string) {
  return trips.find((trip) => trip.id === id);
}

export function getTripsByDriver(driverId: string) {
  return trips.filter((trip) => trip.driver_id === driverId);
}

export function getActiveTripByDriver(driverId: string) {
  return trips.find(
    (trip) =>
      trip.driver_id === driverId &&
      (trip.status === "assigned" || trip.status === "in_transit")
  );
}

export function getTripsByVehicle(vehicleId: string) {
  return trips.filter((trip) => trip.vehicle_id === vehicleId);
}