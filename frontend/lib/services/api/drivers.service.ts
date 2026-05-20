// ============================================================
//  DRIVERS SERVICE
//  Single source of truth for driver operations.
// ============================================================

import { drivers } from "@/lib/modules/fleet/mock/drivers.mock";
import type { Driver } from "@/lib/modules/fleet/types/driver.types";

export class DriversService {
  // ── READ ────────────────────────────────────────────────

  static async getDrivers(): Promise<Driver[]> {
    return Promise.resolve([...drivers]);
  }

  static async getDriverById(id: string): Promise<Driver | undefined> {
    return Promise.resolve(drivers.find((d) => d.id === id));
  }

  // ── FILTERS ─────────────────────────────────────────────

  static async getAvailableDrivers(): Promise<Driver[]> {
    return Promise.resolve(
      drivers.filter((d) => d.status === "available")
    );
  }

  static async getDriversByStatus(status: Driver["status"]): Promise<Driver[]> {
    return Promise.resolve(
      drivers.filter((d) => d.status === status)
    );
  }

  // ── UPDATE ──────────────────────────────────────────────

  static async updateDriver(id: string, input: Partial<Driver>): Promise<Driver> {
    const idx = drivers.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error("Driver not found");

    const updated = { ...drivers[idx], ...input };
    drivers[idx] = updated;

    return Promise.resolve(updated);
  }

  // ── ASSIGN / RELEASE ────────────────────────────────────

  static async assignDriverToTrip(driverId: string, tripId: string): Promise<Driver> {
    return this.updateDriver(driverId, {
      status: "assigned",
      current_trip_id: tripId,
    });
  }

  static async releaseDriver(driverId: string): Promise<Driver> {
    return this.updateDriver(driverId, {
      status: "available",
      current_trip_id: undefined,
    });
  }
}