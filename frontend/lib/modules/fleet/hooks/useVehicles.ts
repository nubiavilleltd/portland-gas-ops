"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { VehiclesService } from "../services/vehicles.service";
import { parseError } from "@/lib/errors";
import { getVehiclesByStatus, getVehiclesInMaintenance, getVehiclesInTransit } from "../selectors/vehicles.selectors";
import { VehicleStatus } from "../types/vehicle.types";
import { CreateVehicleRequest, UpdateVehicleRequest } from "../adapters/fleet.adapter";

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



export function useCreateVehicle() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: CreateVehicleRequest) => VehiclesService.createVehicle(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VEHICLE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: VEHICLE_KEYS.available() });
    },
  });

  return {
    createVehicle: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (vars: { id: string; input: UpdateVehicleRequest }) =>
      VehiclesService.updateVehicle(vars.id, vars.input),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: VEHICLE_KEYS.detail(vars.id) });
      queryClient.invalidateQueries({ queryKey: VEHICLE_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: VEHICLE_KEYS.available() });
    },
  });

  return {
    updateVehicle: mutation.mutateAsync,
    isLoading: mutation.isPending,
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


export function useActivateVehicle() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => VehiclesService.activateVehicle(id),

    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({
        queryKey: VEHICLE_KEYS.detail(id),
      });

      queryClient.invalidateQueries({
        queryKey: VEHICLE_KEYS.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: VEHICLE_KEYS.available(),
      });
    },
  });

  return {
    activateVehicle: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}
export function useDeactivateVehicle() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => VehiclesService.deactivateVehicle(id),

    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({
        queryKey: VEHICLE_KEYS.detail(id),
      });

      queryClient.invalidateQueries({
        queryKey: VEHICLE_KEYS.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: VEHICLE_KEYS.available(),
      });
    },
  });

  return {
    deactivateVehicle: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}

export function useSendVehicleForMaintenance() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => VehiclesService.sendVehicleForMaintenance(id),

    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({
        queryKey: VEHICLE_KEYS.detail(id),
      });

      queryClient.invalidateQueries({
        queryKey: VEHICLE_KEYS.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: VEHICLE_KEYS.available(),
      });
    },
  });

  return {
    sendVehicleForMaintenance: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}


export function useReturnVehicleFromMaintenance() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => VehiclesService.returnVehicleFromMaintenance(id),

    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({
        queryKey: VEHICLE_KEYS.detail(id),
      });

      queryClient.invalidateQueries({
        queryKey: VEHICLE_KEYS.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: VEHICLE_KEYS.available(),
      });
    },
  });

  return {
    returnVehicleFromMaintenance: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}