
// import { vehicles } from "../mock/vehicles.mock";
// import type { Vehicle, VehicleStatus } from "../types/vehicle.types";

// export function getVehicles(): Vehicle[] {
//   return vehicles;
// }

// export function getVehicleById(id: string): Vehicle | undefined {
//   return vehicles.find((vehicle) => vehicle.id === id);
// }

// export function getAvailableVehicles(): Vehicle[] {
//   return vehicles.filter((vehicle) => vehicle.status === "available");
// }

// export function getVehiclesByStatus(status: VehicleStatus): Vehicle[] {
//   return vehicles.filter((vehicle) => vehicle.status === status);
// }

// export function getVehiclesInTransit(): Vehicle[] {
//   return vehicles.filter((v) => v.status === "in_transit");
// }

// export function getVehiclesInMaintenance(): Vehicle[] {
//   return vehicles.filter((v) => v.status === "maintenance");
// }






import type {
  Vehicle,
  VehicleStatus,
} from "../types/vehicle.types";



// ── Single lookup ────────────────────────────────────────

export function getVehicleById(
  vehicles: Vehicle[],
  id: string
): Vehicle | undefined {
  return vehicles.find(
    (vehicle) => vehicle.id === id
  );
}

// ── Filters ──────────────────────────────────────────────

export function getAvailableVehicles(
  vehicles: Vehicle[]
): Vehicle[] {
  return vehicles.filter(
    (vehicle) => vehicle.status === "available"
  );
}

export function getVehiclesByStatus(
  vehicles: Vehicle[],
  status: VehicleStatus
): Vehicle[] {
  return vehicles.filter(
    (vehicle) => vehicle.status === status
  );
}

export function getVehiclesInTransit(
  vehicles: Vehicle[]
): Vehicle[] {
  return vehicles.filter(
    (vehicle) => vehicle.status === "in_transit"
  );
}

export function getVehiclesInMaintenance(
  vehicles: Vehicle[]
): Vehicle[] {
  return vehicles.filter(
    (vehicle) => vehicle.status === "maintenance"
  );
}