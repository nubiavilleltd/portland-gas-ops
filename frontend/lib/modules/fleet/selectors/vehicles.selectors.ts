import { vehicles } from "../mock/vehicles.mock";

export function getVehicles() {
  return vehicles;
}

export function getVehicleById(id: string) {
  return vehicles.find(
    (vehicle) => vehicle.id === id
  );
}

export function getAvailableVehicles() {
  return vehicles.filter(
    (vehicle) => vehicle.status === "available"
  );
}