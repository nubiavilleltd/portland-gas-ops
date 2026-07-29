
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
  employee_id: string;
  license_number: string;
  license_expiry_date: string;
  experience_years: number;
  address?: string;
}): Promise<Driver> {
  try {
    const raw = await fleetApi.createDriver(input);
    return adaptDriver(raw);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Failed to create driver"));
  }
}

  // static async updateDriver(id: string, input: Partial<Driver>): Promise<Driver> {
  //   try {
  //     const raw = await fleetApi.updateDriver(id, input as Record<string, unknown>);
  //     return adaptDriver(raw);
  //   } catch (err) {
  //     throw new Error(getErrorMessage(err, "Failed to update driver"));
  //   }
  // }

  static async updateDriver(
  id: string,
  input: {
    license_number?: string;
    license_expiry_date?: string;
    experience_years?: number;
    address?: string;
  },
): Promise<Driver> {
  try {
    const raw = await fleetApi.updateDriver(id, input as Record<string, unknown>);
    return adaptDriver(raw);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Failed to update driver"));
  }
}

static async suspendDriver(id: string): Promise<Driver> {
  try {
    const raw = await fleetApi.suspendDriver(id);
    return adaptDriver(raw);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Failed to suspend driver"));
  }
}

static async reinstateDriver(id: string): Promise<Driver> {
  try {
    const raw = await fleetApi.reinstateDriver(id);
    return adaptDriver(raw);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Failed to reinstate driver"));
  }
}
static async setDriverOffDuty(id: string): Promise<Driver> {
  try {
    const raw = await fleetApi.setDriverOffDuty(id);
    return adaptDriver(raw);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Failed to set driver off duty"));
  }
}
static async setDriverAvailable(id: string): Promise<Driver> {
  try {
    const raw = await fleetApi.setDriverAvailable(id);
    return adaptDriver(raw);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Failed to make driver available"));
  }
}

}

