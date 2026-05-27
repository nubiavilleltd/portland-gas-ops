"use client";

// ============================================================
//  DRIVERS HOOKS (React Query + Selectors)
// ============================================================

import { useQuery } from "@tanstack/react-query";
import { DriversService } from "../services/drivers.service";
import type { Driver, DriverStatus } from "../types/driver.types";
import { parseError } from "@/lib/errors";

// ── Selectors ─────────────────────────────────────────────
import {
  getDriverById,
  getAvailableDrivers,
  getDriversByStatus,
  getDriversOnActiveTrip,
} from "../selectors/drivers.selectors";
import { FLEET_KEYS } from "../constants/query-keys";

// ───────────────────────────────────────────────────────────
//  BASE HOOK
// ───────────────────────────────────────────────────────────

export function useDrivers() {
  const query = useQuery({
    queryKey: FLEET_KEYS.drivers,
    queryFn: DriversService.getDrivers,
    staleTime: 60 * 1000,
  });

  return {
    drivers: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? parseError(query.error) : null,
    refetch: query.refetch,
  };
}

// ───────────────────────────────────────────────────────────
//  SINGLE DRIVER
// ───────────────────────────────────────────────────────────

export function useDriverById(id: string) {
  const { drivers, isLoading, error, refetch } = useDrivers();

  const driver = getDriverById(drivers, id);

  return {
    driver,
    isLoading,
    error,
    refetch,
  };
}

// ───────────────────────────────────────────────────────────
//  AVAILABLE DRIVERS
// ───────────────────────────────────────────────────────────

export function useAvailableDrivers() {
  const { drivers, isLoading, error, refetch } = useDrivers();

  const availableDrivers = getAvailableDrivers(drivers);

  return {
    drivers: availableDrivers,
    isLoading,
    error,
    refetch,
  };
}

// ───────────────────────────────────────────────────────────
//  FILTER BY STATUS
// ───────────────────────────────────────────────────────────

export function useDriversByStatus(status: DriverStatus) {
  const { drivers, isLoading, error, refetch } = useDrivers();

  const filteredDrivers = getDriversByStatus(drivers, status);

  return {
    drivers: filteredDrivers,
    isLoading,
    error,
    refetch,
  };
}

// ───────────────────────────────────────────────────────────
//  ACTIVE TRIP DRIVERS
// ───────────────────────────────────────────────────────────

export function useDriversOnActiveTrip() {
  const { drivers, isLoading, error, refetch } = useDrivers();

  const activeDrivers = getDriversOnActiveTrip(drivers);

  return {
    drivers: activeDrivers,
    isLoading,
    error,
    refetch,
  };
}