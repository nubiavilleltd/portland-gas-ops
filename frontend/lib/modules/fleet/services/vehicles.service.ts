import { fleetApi } from "../api/fleet.api";
import {
  adaptVehicle,
  CreateVehicleRequest,
  UpdateVehicleRequest,
} from "../adapters/fleet.adapter";
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

  static async getVehiclesByStatus(
    status: Vehicle["status"],
  ): Promise<Vehicle[]> {
    const raw = await fleetApi.listVehicles({ status });
    return raw.map(adaptVehicle);
  }

  static async createVehicle(input: CreateVehicleRequest): Promise<Vehicle> {
    try {
      const form = new FormData();
      const { image, ...rest } = input;
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

 static async updateVehicle(id: string, input: UpdateVehicleRequest): Promise<Vehicle> {
  try {
    const form = new FormData();
    const { image, ...rest } = input;
    form.append("data", JSON.stringify(rest));
    if (image instanceof File) {
      form.append("image", image);
    }
    const raw = await fleetApi.updateVehicle(id, form);
    return adaptVehicle(raw);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Failed to update vehicle"));
  }
}

static async activateVehicle(id: string): Promise<Vehicle> {
  try {
    const raw = await fleetApi.activateVehicle(id);
    return adaptVehicle(raw);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Failed to activate vehicle"));
  }
}
static async deactivateVehicle(id: string): Promise<Vehicle> {
  try {
    const raw = await fleetApi.deactivateVehicle(id);
    return adaptVehicle(raw);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Failed to deactivate vehicle"));
  }
}
static async sendVehicleForMaintenance(id: string): Promise<Vehicle> {
  try {
    const raw = await fleetApi.sendVehicleForMaintenance(id);
    return adaptVehicle(raw);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Failed to send vehicle for maintenance"));
  }
}
static async returnVehicleFromMaintenance(id: string): Promise<Vehicle> {
  try {
    const raw = await fleetApi.returnVehicleFromMaintenance(id);
    return adaptVehicle(raw);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Failed to return vehicle from maintenance"));
  }
}

}







