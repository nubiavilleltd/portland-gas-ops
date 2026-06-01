import { Driver } from "../types/driver.types";

export function canSuspendDriver(driver: Driver): boolean {
  return driver.status === "available" || driver.status === "off_duty";
}

export function canReinstateDriver(driver: Driver): boolean {
  return driver.status === "suspended";
}

export function canSetOffDuty(driver: Driver): boolean {
  return driver.status === "available";
}

export function canSetAvailable(driver: Driver): boolean {
  return driver.status === "off_duty";
}