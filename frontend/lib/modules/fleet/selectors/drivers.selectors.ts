// import { drivers } from "../mock/drivers.mock";

// export function getDrivers() {
//   return drivers;
// }

// export function getDriverById(id: string) {
//   return drivers.find(
//     (driver) => driver.id === id
//   );
// }

// export function getAvailableDrivers() {
//   return drivers.filter(
//     (driver) => driver.status === "available"
//   );
// }





import { drivers } from "../mock/drivers.mock";
import type { Driver, DriverStatus } from "../types/driver.types";

export function getDrivers(): Driver[] {
  return drivers;
}

export function getDriverById(id: string): Driver | undefined {
  return drivers.find((driver) => driver.id === id);
}

export function getAvailableDrivers(): Driver[] {
  return drivers.filter((driver) => driver.status === "available");
}

export function getDriversByStatus(status: DriverStatus): Driver[] {
  return drivers.filter((driver) => driver.status === status);
}

export function getDriversOnActiveTrip(): Driver[] {
  return drivers.filter(
    (d) => d.status === "assigned" || d.status === "in_transit"
  );
}