"use client";

// ============================================================
//  TRIPS HOOKS
//
//  useTrips()                   — fetches all trips via service
//  useTripById(id)              — finds one trip by id
//  useActiveTrips()             — assigned | dispatched | in_transit
//  usePendingTrips()            — status === "pending"
//  useTripsByDriver(driverId)   — trips for a specific driver
//  useTripsByVehicle(vehicleId) — trips for a specific vehicle
//
//  TODAY:   useEffect + service call (mock data)
//  FUTURE:  swap useEffect body for useQuery — components unchanged
//
//  FUTURE SWAP (useTrips):
//    return useQuery({
//      queryKey: FLEET_KEYS.trips,
//      queryFn:  () => TripsService.getTrips(),
//    });
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { TripsService } from "@/lib/modules/fleet/services/trips.service";
import type { Trip } from "@/lib/modules/fleet/types/trip.types";
import {
  getTripById,
  getActiveTrips,
  getPendingTrips,
  getTripsByDriver,
  getTripsByVehicle,
} from "@/lib/modules/fleet/selectors/trips.selectors";
import { parseError } from "@/lib/errors";

// ── Shared result shape ────────────────────────────────────
interface UseTripsResult {
  trips:     Trip[];
  isLoading: boolean;
  error:     string | null;
  refetch:   () => void;
}

// ── Base hook ─────────────────────────────────────────────
export function useTrips(): UseTripsResult {
  const [trips,     setTrips]     = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await TripsService.getTrips();
      setTrips(data);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { trips, isLoading, error, refetch: fetch };
}

// ── Derived: single trip by id ────────────────────────────
interface UseTripByIdResult {
  trip:      Trip | undefined;
  isLoading: boolean;
  error:     string | null;
  refetch:   () => void;
}

export function useTripById(id: string): UseTripByIdResult {
  const { trips, isLoading, error, refetch } = useTrips();
  const trip = getTripById(trips, id);   // selector
  return { trip, isLoading, error, refetch };
}

// ── Derived: active trips ─────────────────────────────────
export function useActiveTrips(): UseTripsResult {
  const { trips, isLoading, error, refetch } = useTrips();
  const active = getActiveTrips(trips);   // selector
  return { trips: active, isLoading, error, refetch };
}

// ── Derived: pending trips ────────────────────────────────
export function usePendingTrips(): UseTripsResult {
  const { trips, isLoading, error, refetch } = useTrips();
  const pending = getPendingTrips(trips);   // selector
  return { trips: pending, isLoading, error, refetch };
}

// ── Derived: trips for a specific driver ──────────────────
export function useTripsByDriver(driverId: string): UseTripsResult {
  const { trips, isLoading, error, refetch } = useTrips();
  const driverTrips = getTripsByDriver(trips, driverId);   // selector
  return { trips: driverTrips, isLoading, error, refetch };
}

// ── Derived: trips for a specific vehicle ─────────────────
export function useTripsByVehicle(vehicleId: string): UseTripsResult {
  const { trips, isLoading, error, refetch } = useTrips();
  const vehicleTrips = getTripsByVehicle(trips, vehicleId);   // selector
  return { trips: vehicleTrips, isLoading, error, refetch };
}