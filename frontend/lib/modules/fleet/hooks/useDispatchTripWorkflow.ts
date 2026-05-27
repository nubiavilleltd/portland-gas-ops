"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { dispatchTripWorkflow } from "../workflows/dispatch-trip.workflow";
import { FLEET_KEYS } from "../constants/query-keys";

import type { Trip } from "../types/trip.types";
import { useRouter } from "next/navigation";
import { FLEET_ROUTES } from "../constants/routes";

export function useDispatchTripWorkflow() {
  const queryClient = useQueryClient();
   const router = useRouter();

  return useMutation({
    mutationFn: async (trip?: Trip) => {
      if (!trip) throw new Error("Trip not loaded");
      return dispatchTripWorkflow(trip);
    },

    onSuccess: (updatedTrip) => {
      queryClient.setQueryData(
        FLEET_KEYS.trip(updatedTrip.id),
        updatedTrip
      );

      queryClient.setQueryData(
        FLEET_KEYS.trips(),
        (old?: Trip[]) =>
          old?.map((t) =>
            t.id === updatedTrip.id ? updatedTrip : t
          )
      );

      toast.success("Trip dispatched successfully");
      router.push(FLEET_ROUTES.tripDetail(updatedTrip?.id as string));
    },

    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to dispatch trip");
    },
  });
}