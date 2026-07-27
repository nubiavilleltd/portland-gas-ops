"use client";
import { useQuery } from "@tanstack/react-query";
import { VehiclesService } from "../services/vehicles.service";
import { parseError } from "@/lib/errors";
import { getVehiclesByStatus, getVehiclesInMaintenance, getVehiclesInTransit } from "../selectors/vehicles.selectors";
import { VehicleStatus } from "../types/vehicle.types";

const VEHICLE_KEYS = {
  all:       ["vehicles"],
  lists:     () => [...VEHICLE_KEYS.all, "list"],
  available: () => [...VEHICLE_KEYS.all, "available"],
  detail:    (id: string) => [...VEHICLE_KEYS.all, id],
};

export function useVehicles() {
  const query = useQuery({
    queryKey: VEHICLE_KEYS.lists(),
    queryFn:  VehiclesService.getVehicles,
    staleTime: 30_000,
  });
  return {
    vehicles:  query.data ?? [],
    isLoading: query.isLoading,
    error:     query.error ? parseError(query.error) : null,
    refetch:   query.refetch,
  };
}

export function useAvailableVehicles() {
  const query = useQuery({
    queryKey: VEHICLE_KEYS.available(),
    queryFn:  VehiclesService.getAvailableVehicles,
    staleTime: 30_000,
  });
  return {
    vehicles:  query.data ?? [],
    isLoading: query.isLoading,
  };
}

export function useVehicleById(id: string) {
  const query = useQuery({
    queryKey: VEHICLE_KEYS.detail(id),
    queryFn:  () => VehiclesService.getVehicleById(id),
    enabled:  !!id,
    staleTime: 30_000,
  });
  return {
    vehicle:   query.data,
    isLoading: query.isLoading,
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