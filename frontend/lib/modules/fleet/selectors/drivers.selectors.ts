import type { Driver, DriverStatus } from "../types/driver.types";


// ── Single lookup ────────────────────────────────────────

export function getDriverById(
  drivers: Driver[],
  id: string
): Driver | undefined {
  return drivers.find(
    (driver) => driver.id === id
  );
}

// ── Filters ──────────────────────────────────────────────

export function getAvailableDrivers(
  drivers: Driver[]
): Driver[] {
  return drivers.filter(
    (driver) => driver.status === "available"
  );
}

export function getDriversByStatus(
  drivers: Driver[],
  status: DriverStatus
): Driver[] {
  return drivers.filter(
    (driver) => driver.status === status
  );
}

export function getDriversOnActiveTrip(
  drivers: Driver[]
): Driver[] {
  return drivers.filter(
    (d) =>
      d.status === "assigned" ||
      d.status === "in_transit"
  );
}