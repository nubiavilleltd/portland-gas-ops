"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { startTripWorkflow } from "../workflows/start-trip.workflow";

import { FLEET_KEYS } from "../constants/query-keys";
import { ORDER_KEYS } from "@/lib/modules/orders/constants/query-keys";

import type { Trip } from "../types/trip.types";
import { FLEET_ROUTES } from "../constants/routes";

export function useStartTripWorkflow() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (trip: Trip) => startTripWorkflow(trip),

    onSuccess: (updatedTrip: Trip) => {
      // ✅ Update single trip cache
      queryClient.setQueryData(
        FLEET_KEYS.trip(updatedTrip.id),
        updatedTrip
      );

      // ✅ Sync trip lists
       queryClient.setQueriesData(
  { queryKey: FLEET_KEYS.trips() },
  (old: Trip[] | undefined) => {
    if (!Array.isArray(old)) return old;

    return old.map((trip) =>
      trip.id === updatedTrip.id ? updatedTrip : trip
    );
  }
);

      // ❗ Orders changed (in_transit status)
      queryClient.invalidateQueries({
        queryKey: ORDER_KEYS.lists(),
      });

      toast.success("Trip started successfully");

      router.push(
        FLEET_ROUTES.tripDetail(updatedTrip.trip_number)
      );

      // ✅ Driver status changed to in_transit
queryClient.invalidateQueries({
  queryKey: FLEET_KEYS.drivers(),
});

// ✅ Vehicle status changed to in_transit
queryClient.invalidateQueries({
  queryKey: FLEET_KEYS.vehicles(),
});
    },

    

    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to start trip");
    },
  });
}