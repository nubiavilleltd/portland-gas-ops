
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  assignResourcesWorkflow,
  type AssignResourcesInput,
} from "../workflows/assign-trip-resources.workflow";

import type { Trip } from "../types/trip.types";

import { FLEET_KEYS } from "../constants/query-keys";
import { ORDER_KEYS } from "@/lib/modules/orders/constants/query-keys";

import { FLEET_ROUTES } from "../constants/routes";

export function useAssignResourcesWorkflow() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: AssignResourcesInput) =>
      assignResourcesWorkflow(input),

    onSuccess: (updatedTrip: Trip) => {
      // ✅ SINGLE TRIP CACHE
      queryClient.setQueryData(
        FLEET_KEYS.trip(updatedTrip.id),
        updatedTrip
      );

      // ✅ UPDATE TRIPS LIST CACHE
    //   queryClient.setQueriesData(
    //     { queryKey: FLEET_KEYS.trips() },
    //     (old?: Trip[]) =>
    //       old?.map((trip) =>
    //         trip.id === updatedTrip.id
    //           ? updatedTrip
    //           : trip
    //       )
    //   );

    queryClient.setQueriesData(
  { queryKey: FLEET_KEYS.trips() },
  (old: Trip[] | undefined) => {
    if (!Array.isArray(old)) return old;

    return old.map((trip) =>
      trip.id === updatedTrip.id ? updatedTrip : trip
    );
  }
);

      // ✅ DRIVER + VEHICLE STATUS CHANGED
      queryClient.invalidateQueries({
        queryKey: FLEET_KEYS.drivers(),
      });

      queryClient.invalidateQueries({
        queryKey: FLEET_KEYS.vehicles(),
      });

      // ✅ ORDERS UPDATED TO ASSIGNED
      queryClient.invalidateQueries({
        queryKey: ORDER_KEYS.lists(),
      });

      toast.success(
        "Driver and vehicle assigned successfully"
      );

      router.push(
        FLEET_ROUTES.tripDetail(updatedTrip.id)
      );
    },

    onError: (err: any) => {
      toast.error(
        err?.message ??
          "Failed to assign driver and vehicle"
      );
    },
  });
}