import { Vehicle } from "../types/vehicle.types";

export function canSendForMaintenance(vehicle: Vehicle): boolean {
  return vehicle.status === "available";
}

export function canReturnFromMaintenance(vehicle: Vehicle): boolean {
  return vehicle.status === "maintenance";
}

export function canDeactivateVehicle(vehicle: Vehicle): boolean {
  return (
    vehicle.status === "available" ||
    vehicle.status === "maintenance"
  );
}

export function canActivateVehicle(vehicle: Vehicle): boolean {
  return vehicle.status === "inactive";
}