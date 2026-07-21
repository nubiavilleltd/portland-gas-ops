

"use client";
import { useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import { DriversService } from "../services/drivers.service";
import { parseError } from "@/lib/errors";

const DRIVER_KEYS = {
  all: ["drivers"],
  lists: () => [...DRIVER_KEYS.all, "list"],
  available: () => [...DRIVER_KEYS.all, "available"],
  detail: (id: string) => [...DRIVER_KEYS.all, id],
};

export function useDrivers() {
  const query = useQuery({
    queryKey: DRIVER_KEYS.lists(),
    queryFn: DriversService.getDrivers,
    staleTime: 30_000,
  });
  return {
    drivers: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? parseError(query.error) : null,
    refetch: query.refetch,
  };
}

export function useAvailableDrivers() {
  const query = useQuery({
    queryKey: DRIVER_KEYS.available(),
    queryFn: DriversService.getAvailableDrivers,
    staleTime: 30_000,
  });
  return {
    drivers: query.data ?? [],
    isLoading: query.isLoading,
  };
}

export function useDriverById(id: string) {
  const query = useQuery({
    queryKey: DRIVER_KEYS.detail(id),
    queryFn: () => DriversService.getDriverById(id),
    enabled: !!id,
    staleTime: 30_000,
  });
  return {
    driver: query.data,
    isLoading: query.isLoading,
  };
}



export function useCreateDriver() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: Parameters<typeof DriversService.createDriver>[0]) =>
      DriversService.createDriver(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DRIVER_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: DRIVER_KEYS.available() });
    },
  });

  return {
    createDriver: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}



export function useUpdateDriver() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (vars: { id: string; input: Parameters<typeof DriversService.updateDriver>[1] }) =>
      DriversService.updateDriver(vars.id, vars.input),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: DRIVER_KEYS.detail(vars.id) });
      queryClient.invalidateQueries({ queryKey: DRIVER_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: DRIVER_KEYS.available() });
    },
  });

  return {
    updateDriver: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}

export function useSuspendDriver() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => DriversService.suspendDriver(id),

    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({
        queryKey: DRIVER_KEYS.detail(id),
      });

      queryClient.invalidateQueries({
        queryKey: DRIVER_KEYS.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: DRIVER_KEYS.available(),
      });
    },
  });

  return {
    suspendDriver: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}

export function useReinstateDriver() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => DriversService.suspendDriver(id),

    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({
        queryKey: DRIVER_KEYS.detail(id),
      });

      queryClient.invalidateQueries({
        queryKey: DRIVER_KEYS.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: DRIVER_KEYS.available(),
      });
    },
  });

  return {
    suspendDriver: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}