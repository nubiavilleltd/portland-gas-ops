import { drivers } from "../mock/drivers.mock";

export function getDrivers() {
  return drivers;
}

export function getDriverById(id: string) {
  return drivers.find(
    (driver) => driver.id === id
  );
}

export function getAvailableDrivers() {
  return drivers.filter(
    (driver) => driver.status === "available"
  );
}