// lib/modules/fleet/hooks/useCompleteTripWorkflow.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  completeTripWorkflow,
  type CompleteTripInput,
} from "../workflows/complete-trip.workflow";

import type { Trip } from "../types/trip.types";
import { FLEET_KEYS } from "../constants/query-keys";
import { ORDER_KEYS } from "@/lib/modules/orders/constants/query-keys";
import { FLEET_ROUTES } from "../constants/routes";

export function useCompleteTripWorkflow() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: CompleteTripInput) => completeTripWorkflow(input),

    onSuccess: (updatedTrip: Trip) => {
      // ✅ Single trip cache
      queryClient.setQueryData(
        FLEET_KEYS.trip(updatedTrip.id),
        updatedTrip
      );

      // ✅ Sync trips list
      queryClient.setQueriesData(
        { queryKey: FLEET_KEYS.trips() },
        (old: Trip[] | undefined) => {
          if (!Array.isArray(old)) return old;
          return old.map((trip) =>
            trip.id === updatedTrip.id ? updatedTrip : trip
          );
        }
      );

      // ✅ Driver and vehicle freed
      queryClient.invalidateQueries({
        queryKey: FLEET_KEYS.drivers(),
      });
      queryClient.invalidateQueries({
        queryKey: FLEET_KEYS.vehicles(),
      });

      // ✅ Orders may have been affected
      queryClient.invalidateQueries({
        queryKey: ORDER_KEYS.lists(),
      });

      toast.success("Trip completed successfully");

      router.push(FLEET_ROUTES.tripDetail(updatedTrip.id));
    },

    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to complete trip");
    },
  });
}