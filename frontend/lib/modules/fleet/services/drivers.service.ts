// // ============================================================
// //  DRIVERS SERVICE
// //  Single source of truth for driver operations.
// // ============================================================

// import { drivers } from "@/lib/modules/fleet/mock/drivers.mock";
// import type { Driver } from "@/lib/modules/fleet/types/driver.types";

// export class DriversService {
//   // ── READ ────────────────────────────────────────────────

//   static async getDrivers(): Promise<Driver[]> {
//     return Promise.resolve([...drivers]);
//   }

//   static async getDriverById(id: string): Promise<Driver | undefined> {
//     return Promise.resolve(drivers.find((d) => d.id === id));
//   }

//   // ── FILTERS ─────────────────────────────────────────────

//   static async getAvailableDrivers(): Promise<Driver[]> {
//     return Promise.resolve(
//       drivers.filter((d) => d.status === "available")
//     );
//   }

//   static async getDriversByStatus(status: Driver["status"]): Promise<Driver[]> {
//     return Promise.resolve(
//       drivers.filter((d) => d.status === status)
//     );
//   }


//     static async createDriver(
//     input: Omit<Driver, "id" | "created_at">
//   ): Promise<Driver> {
//     const newDriver: Driver = {
//       id: `drv-${Date.now()}`,
//       created_at: new Date().toISOString().split("T")[0],
//       ...input,
//     };

//     drivers.push(newDriver);

//     return Promise.resolve(newDriver);
//   }

//   // ── UPDATE ──────────────────────────────────────────────

//   static async updateDriver(id: string, input: Partial<Driver>): Promise<Driver> {
//     const idx = drivers.findIndex((d) => d.id === id);
//     if (idx === -1) throw new Error("Driver not found");

//     const updated = { ...drivers[idx], ...input };
//     drivers[idx] = updated;

//     return Promise.resolve(updated);
//   }

//   // ── ASSIGN / RELEASE ────────────────────────────────────

//   static async assignDriverToTrip(driverId: string, tripId: string): Promise<Driver> {
//     return this.updateDriver(driverId, {
//       status: "assigned",
//       current_trip_id: tripId,
//     });
//   }

//   static async releaseDriver(driverId: string): Promise<Driver> {
//     return this.updateDriver(driverId, {
//       status: "available",
//       current_trip_id: undefined,
//     });
//   }
// }






import { fleetApi } from "../api/fleet.api";
import { adaptDriver } from "../adapters/fleet.adapter";
import { getErrorMessage } from "@/lib/api/error";
import type { Driver } from "../types/driver.types";

export class DriversService {

  static async getDrivers(): Promise<Driver[]> {
    const raw = await fleetApi.listDrivers();
    return raw.map(adaptDriver);
  }

  static async getDriverById(id: string): Promise<Driver | undefined> {
    try {
      const raw = await fleetApi.getDriver(id);
      return adaptDriver(raw);
    } catch {
      return undefined;
    }
  }

  static async getAvailableDrivers(): Promise<Driver[]> {
    const raw = await fleetApi.listAvailableDrivers();
    return raw.map(adaptDriver);
  }

  static async getDriversByStatus(status: Driver["status"]): Promise<Driver[]> {
    const raw = await fleetApi.listDrivers({ status });
    return raw.map(adaptDriver);
  }

  static async createDriver(input: {
    full_name: string;
    email: string;
    phone_number: string;
    license_number: string;
    license_expiry_date: string;
    experience_years: number;
    address?: string;
    profile_image?: string;
    status?: string;
  }): Promise<Driver> {
    try {
      const form = new FormData();
      form.append("data", JSON.stringify({
        full_name:           input.full_name,
        email:               input.email,
        phone_number:        input.phone_number,
        license_number:      input.license_number,
        license_expiry_date: input.license_expiry_date,
        experience_years:    input.experience_years,
        address:             input.address,
      }));
      const raw = await fleetApi.createDriver(form);
      return adaptDriver(raw);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to create driver"));
    }
  }

  static async updateDriver(id: string, input: Partial<Driver>): Promise<Driver> {
    try {
      const raw = await fleetApi.updateDriver(id, input as Record<string, unknown>);
      return adaptDriver(raw);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to update driver"));
    }
  }

  // These are kept for backwards compatibility in trip workflows
  // but are now no-ops — backend handles driver status automatically
  static async assignDriverToTrip(_driverId: string, _tripId: string): Promise<Driver> {
    return DriversService.getDriverById(_driverId) as Promise<Driver>;
  }

  static async releaseDriver(_driverId: string): Promise<Driver> {
    return DriversService.getDriverById(_driverId) as Promise<Driver>;
  }
}