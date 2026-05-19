// ============================================================
//  VEHICLES SERVICE
//  Single source of truth for fleet vehicle operations.
// ============================================================

import { vehicles } from "@/lib/modules/fleet/mock/vehicles.mock";
import type { Vehicle } from "@/lib/modules/fleet/types/vehicle.types";

export class VehiclesService {
  // ── READ ────────────────────────────────────────────────

  static async getVehicles(): Promise<Vehicle[]> {
    return Promise.resolve([...vehicles]);
  }

  static async getVehicleById(id: string): Promise<Vehicle | undefined> {
    return Promise.resolve(vehicles.find((v) => v.id === id));
  }

  // ── FILTERS ─────────────────────────────────────────────

  static async getAvailableVehicles(): Promise<Vehicle[]> {
    return Promise.resolve(
      vehicles.filter((v) => v.status === "available")
    );
  }

  static async getVehiclesByStatus(status: Vehicle["status"]): Promise<Vehicle[]> {
    return Promise.resolve(
      vehicles.filter((v) => v.status === status)
    );
  }

  // ── UPDATE ──────────────────────────────────────────────

  static async updateVehicle(id: string, input: Partial<Vehicle>): Promise<Vehicle> {
    const idx = vehicles.findIndex((v) => v.id === id);
    if (idx === -1) throw new Error("Vehicle not found");

    const updated = { ...vehicles[idx], ...input };
    vehicles[idx] = updated;

    return Promise.resolve(updated);
  }

  // ── ASSIGN / RELEASE ────────────────────────────────────

  static async assignVehicleToTrip(vehicleId: string, tripId: string): Promise<Vehicle> {
    return this.updateVehicle(vehicleId, {
      status: "in_use",
      current_trip_id: tripId,
    });
  }

  static async releaseVehicle(vehicleId: string): Promise<Vehicle> {
    return this.updateVehicle(vehicleId, {
      status: "available",
      current_trip_id: undefined,
    });
  }
}