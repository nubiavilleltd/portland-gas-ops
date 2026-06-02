"use client";

import { useCallback, useEffect, useState } from "react";

import { VehiclesService } from "@/lib/modules/fleet/services/vehicles.service";
import type {
  Vehicle,
  VehicleStatus,
} from "../types/vehicle.types";

import {
  getVehicleById,
  getVehiclesByStatus,
  getAvailableVehicles,
  getVehiclesInTransit,
  getVehiclesInMaintenance,
} from "../selectors/vehicles.selectors";

import { parseError } from "@/lib/errors";

// ─────────────────────────────────────────────
// BASE HOOK
// ─────────────────────────────────────────────

interface UseVehiclesResult {
  vehicles: Vehicle[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useVehicles(): UseVehiclesResult {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await VehiclesService.getVehicles();
      setVehicles(data);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  return {
    vehicles,
    isLoading,
    error,
    refetch: fetchVehicles,
  };
}

// ─────────────────────────────────────────────
// DERIVED HOOKS
// ─────────────────────────────────────────────

export function useVehicleById(id: string) {
  const { vehicles, isLoading, error, refetch } =
    useVehicles();

  const vehicle = getVehicleById(vehicles, id);

  return {
    vehicle,
    isLoading,
    error,
    refetch,
  };
}

export function useAvailableVehicles() {
  const { vehicles, isLoading, error, refetch } =
    useVehicles();

  const availableVehicles =
    getAvailableVehicles(vehicles);

  return {
    vehicles: availableVehicles,
    isLoading,
    error,
    refetch,
  };
}

export function useVehiclesByStatus(
  status: VehicleStatus
) {
  const { vehicles, isLoading, error, refetch } =
    useVehicles();

  const filtered = getVehiclesByStatus(
    vehicles,
    status
  );

  return {
    vehicles: filtered,
    isLoading,
    error,
    refetch,
  };
}

export function useVehiclesInTransit() {
  const { vehicles, isLoading, error, refetch } =
    useVehicles();

  const filtered =
    getVehiclesInTransit(vehicles);

  return {
    vehicles: filtered,
    isLoading,
    error,
    refetch,
  };
}

export function useVehiclesInMaintenance() {
  const { vehicles, isLoading, error, refetch } =
    useVehicles();

  const filtered =
    getVehiclesInMaintenance(vehicles);

  return {
    vehicles: filtered,
    isLoading,
    error,
    refetch,
  };
}