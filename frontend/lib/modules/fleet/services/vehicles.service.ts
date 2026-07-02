// // ============================================================
// //  VEHICLES SERVICE
// //  Single source of truth for fleet vehicle operations.
// // ============================================================

// import { vehicles } from "@/lib/modules/fleet/mock/vehicles.mock";
// import type { Vehicle } from "@/lib/modules/fleet/types/vehicle.types";

// export class VehiclesService {
//   // ── READ ────────────────────────────────────────────────

//   static async getVehicles(): Promise<Vehicle[]> {
//     return Promise.resolve([...vehicles]);
//   }

//   static async getVehicleById(id: string): Promise<Vehicle | undefined> {
//     return Promise.resolve(vehicles.find((v) => v.id === id));
//   }

//   // ── FILTERS ─────────────────────────────────────────────

//   static async getAvailableVehicles(): Promise<Vehicle[]> {
//     return Promise.resolve(
//       vehicles.filter((v) => v.status === "available")
//     );
//   }

//   static async getVehiclesByStatus(status: Vehicle["status"]): Promise<Vehicle[]> {
//     return Promise.resolve(
//       vehicles.filter((v) => v.status === status)
//     );
//   }

//   static async createVehicle(
//   input: Omit<Vehicle, "id" | "created_at" | "current_trip_id">
// ): Promise<Vehicle> {
//   const newVehicle: Vehicle = {
//     id: `veh-${Date.now()}`,
//     created_at: new Date().toISOString(),
//     ...input,
//   };

//   vehicles.push(newVehicle);
//   return Promise.resolve(newVehicle);
// }

//   // ── UPDATE ──────────────────────────────────────────────

//   static async updateVehicle(id: string, input: Partial<Vehicle>): Promise<Vehicle> {
//     const idx = vehicles.findIndex((v) => v.id === id);
//     if (idx === -1) throw new Error("Vehicle not found");

//     const updated = { ...vehicles[idx], ...input };
//     vehicles[idx] = updated;

//     return Promise.resolve(updated);
//   }

//   // ── ASSIGN / RELEASE ────────────────────────────────────

//   // static async assignVehicleToTrip(vehicleId: string, tripId: string): Promise<Vehicle> {
//   //   return this.updateVehicle(vehicleId, {
//   //     status: "in_use",
//   //     current_trip_id: tripId,
//   //   });
//   // }

//   static async assignVehicleToTrip(vehicleId: string, tripId: string): Promise<Vehicle> {
//   return this.updateVehicle(vehicleId, {
//     status: "assigned",
//     current_trip_id: tripId,
//   });
// }

//   static async releaseVehicle(vehicleId: string): Promise<Vehicle> {
//     return this.updateVehicle(vehicleId, {
//       status: "available",
//       current_trip_id: undefined,
//     });
//   }
// }







import { fleetApi } from "../api/fleet.api";
import { adaptVehicle } from "../adapters/fleet.adapter";
import { getErrorMessage } from "@/lib/api/error";
import type { Vehicle } from "../types/vehicle.types";

export class VehiclesService {

  static async getVehicles(): Promise<Vehicle[]> {
    const raw = await fleetApi.listVehicles();
    return raw.map(adaptVehicle);
  }

  static async getVehicleById(id: string): Promise<Vehicle | undefined> {
    try {
      const raw = await fleetApi.getVehicle(id);
      return adaptVehicle(raw);
    } catch {
      return undefined;
    }
  }

  static async getAvailableVehicles(): Promise<Vehicle[]> {
    const raw = await fleetApi.listAvailableVehicles();
    return raw.map(adaptVehicle);
  }

  static async getVehiclesByStatus(status: Vehicle["status"]): Promise<Vehicle[]> {
    const raw = await fleetApi.listVehicles({ status });
    return raw.map(adaptVehicle);
  }

  static async createVehicle(input: Omit<Vehicle, "id" | "created_at" | "current_trip_id">): Promise<Vehicle> {
    try {
      const form = new FormData();
      const { image, ...rest } = input as any;
      form.append("data", JSON.stringify(rest));
      if (image instanceof File) {
        form.append("image", image);
      }
      const raw = await fleetApi.createVehicle(form);
      return adaptVehicle(raw);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to create vehicle"));
    }
  }

  static async updateVehicle(id: string, input: Partial<Vehicle>): Promise<Vehicle> {
    try {
      const raw = await fleetApi.updateVehicle(id, input as Record<string, unknown>);
      return adaptVehicle(raw);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to update vehicle"));
    }
  }

  // No-ops — backend handles vehicle status automatically via trip operations
  static async assignVehicleToTrip(_vehicleId: string, _tripId: string): Promise<Vehicle> {
    return VehiclesService.getVehicleById(_vehicleId) as Promise<Vehicle>;
  }

  static async releaseVehicle(_vehicleId: string): Promise<Vehicle> {
    return VehiclesService.getVehicleById(_vehicleId) as Promise<Vehicle>;
  }
}