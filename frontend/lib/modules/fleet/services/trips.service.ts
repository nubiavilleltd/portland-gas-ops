
// import { getActiveTripByDriver, getTripsByVehicle } from "./trips.selectors";
// import { Trip } from "./trips.mock";
import { drivers } from "../mock/drivers.mock";
import { trips } from "../mock/trips.mock";
import { vehicles } from "../mock/vehicles.mock";
import { getActiveTripByDriver, getTripsByVehicle } from "../selectors/trips.selectors";

// export function assignTrip({
//   tripId,
//   driverId,
//   vehicleId,
// }: {
//   tripId: string;
//   driverId: string;
//   vehicleId: string;
// }) {
//   const trip = trips.find((t) => t.id === tripId);

//   if (!trip) {
//     throw new Error("Trip not found");
//   }

//   if (trip.status !== "pending") {
//     throw new Error("Only pending trips can be assigned");
//   }

//   // check driver availability
//   const driverBusy = getActiveTripByDriver(driverId);

//   if (driverBusy) {
//     throw new Error("Driver already assigned to an active trip");
//   }

//   // check vehicle availability
//   const vehicleBusy = getTripsByVehicle(vehicleId).find(
//     (t) => t.status === "assigned" || t.status === "in_transit"
//   );

//   if (vehicleBusy) {
//     throw new Error("Vehicle already assigned to an active trip");
//   }

//   // assign
//   trip.driver_id = driverId;
//   trip.vehicle_id = vehicleId;
//   trip.status = "assigned";

//   return trip;
// }



export function assignTrip({
  tripId,
  driverId,
  vehicleId,
}: {
  tripId: string;
  driverId: string;
  vehicleId: string;
}) {
  const trip = trips.find((t) => t.id === tripId);

  if (!trip) {
    throw new Error("Trip not found");
  }

  if (trip.status !== "pending") {
    throw new Error("Only pending trips can be assigned");
  }

  const driverBusy = getActiveTripByDriver(driverId);
  if (driverBusy) {
    throw new Error("Driver already assigned to active trip");
  }

  const vehicleBusy = getTripsByVehicle(vehicleId).find(
    (t) => t.status === "assigned" || t.status === "in_transit"
  );

  if (vehicleBusy) {
    throw new Error("Vehicle already assigned to active trip");
  }

  // ✅ ASSIGN TRIP
  trip.driver_id = driverId;
  trip.vehicle_id = vehicleId;
  trip.status = "assigned";

  // 🔥 CRITICAL FIX: BACK-REFERENCE LINKS

  const driver = drivers.find((d) => d.id === driverId);
  if (driver) {
    driver.status = "assigned";
    driver.current_trip_id = tripId;
  }

  const vehicle = vehicles.find((v) => v.id === vehicleId);
  if (vehicle) {
    vehicle.status = "in_use";
    vehicle.current_trip_id = tripId;
  }

  return trip;
}

export function startTrip(tripId: string) {
  const trip = trips.find((t) => t.id === tripId);

  if (!trip) throw new Error("Trip not found");

  if (trip.status !== "assigned") {
    throw new Error("Trip must be assigned before starting");
  }

  trip.status = "in_transit";
  trip.started_at = new Date().toISOString();

  return trip;
}

export function completeTrip(tripId: string) {
  const trip = trips.find((t) => t.id === tripId);

  if (!trip) throw new Error("Trip not found");

  if (trip.status !== "in_transit") {
    throw new Error("Trip must be in transit to complete");
  }

  trip.status = "completed";
  trip.completed_at = new Date().toISOString();

  return trip;
}