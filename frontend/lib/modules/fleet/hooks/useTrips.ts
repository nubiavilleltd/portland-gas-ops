"use client";
import { useQuery } from "@tanstack/react-query";
import { TripsService } from "../services/trips.service";
import { parseError } from "@/lib/errors";
import { getActiveTrips, getPendingTrips, getTripByNo, getTripsByDriver, getTripsByVehicle } from "../selectors/trips.selectors";
import { FLEET_KEYS } from "../constants/query-keys";



export function useTrips() {
  const query = useQuery({
    queryKey: FLEET_KEYS.trips(),
    queryFn:  TripsService.getTrips,
    staleTime: 30_000,
  });
  return {
    trips:     query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error:     query.error ? parseError(query.error) : null,
    refetch:   query.refetch,
  };
}

export function useTripById(id: string) {
  const query = useQuery({
    queryKey: FLEET_KEYS.trip(id),
    queryFn:  () => TripsService.getTripById(id),
    enabled:  !!id,
    staleTime: 30_000,
  });
  return {
    trip:      query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error:     query.error ? parseError(query.error) : null,
  };
}


export function useTripByNo(tripNo: string) {
  const { trips, isLoading, isFetching, error, refetch } = useTrips();
  const trip = getTripByNo(trips, tripNo);   // selector
  return { trip, isLoading, isFetching, error, refetch };
}

// ── Derived: active trips ─────────────────────────────────
export function useActiveTrips() {
  const { trips, isLoading, isFetching, error, refetch } = useTrips();
  const active = getActiveTrips(trips);   // selector
  return { trips: active, isLoading, isFetching, error, refetch };
}

// ── Derived: pending trips ────────────────────────────────
export function usePendingTrips() {
  const { trips, isLoading, isFetching, error, refetch } = useTrips();
  const pending = getPendingTrips(trips);   // selector
  return { trips: pending, isLoading, isFetching, error, refetch };
}

// ── Derived: trips for a specific driver ──────────────────
export function useTripsByDriver(driverId: string) {
  const { trips, isLoading, isFetching, error, refetch } = useTrips();
  const driverTrips = getTripsByDriver(trips, driverId);   // selector
  return { trips: driverTrips, isLoading, isFetching, error, refetch };
}

// ── Derived: trips for a specific vehicle ─────────────────
export function useTripsByVehicle(vehicleId: string) {
  const { trips, isLoading, isFetching, error, refetch } = useTrips();
  const vehicleTrips = getTripsByVehicle(trips, vehicleId);   // selector
  return { trips: vehicleTrips, isLoading, isFetching, error, refetch };
}
