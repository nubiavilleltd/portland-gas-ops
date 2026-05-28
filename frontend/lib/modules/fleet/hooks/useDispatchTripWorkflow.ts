// "use client";

// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { toast } from "sonner";

// import { dispatchTripWorkflow } from "../workflows/dispatch-trip.workflow";
// import { FLEET_KEYS } from "../constants/query-keys";

// import type { Trip } from "../types/trip.types";
// import { useRouter } from "next/navigation";
// import { FLEET_ROUTES } from "../constants/routes";

// export function useDispatchTripWorkflow() {
//   const queryClient = useQueryClient();
//    const router = useRouter();

//   return useMutation({
//     mutationFn: async (trip?: Trip) => {
//       if (!trip) throw new Error("Trip not loaded");
//       return dispatchTripWorkflow(trip);
//     },

//     onSuccess: (updatedTrip) => {
//       queryClient.setQueryData(
//         FLEET_KEYS.trip(updatedTrip.id),
//         updatedTrip
//       );

//       queryClient.setQueryData(
//         FLEET_KEYS.trips(),
//         (old?: Trip[]) =>
//           old?.map((t) =>
//             t.id === updatedTrip.id ? updatedTrip : t
//           )
//       );

//       toast.success("Trip dispatched successfully");
//       router.push(FLEET_ROUTES.tripDetail(updatedTrip?.id as string));
//     },

//     onError: (err: any) => {
//       toast.error(err?.message ?? "Failed to dispatch trip");
//     },
//   });
// }



"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { dispatchTripWorkflow } from "../workflows/dispatch-trip.workflow";

import { FLEET_KEYS } from "../constants/query-keys";
import { ORDER_KEYS } from "@/lib/modules/orders/constants/query-keys";

import type { Trip } from "../types/trip.types";

import { FLEET_ROUTES } from "../constants/routes";

export function useDispatchTripWorkflow() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (trip: Trip) => {
      if (!trip) {
        throw new Error("Trip not loaded");
      }

      return dispatchTripWorkflow(trip);
    },

    onSuccess: (updatedTrip) => {
      // ✅ SINGLE TRIP CACHE
      queryClient.setQueryData(
        FLEET_KEYS.trip(updatedTrip.id),
        updatedTrip
      );

      // ✅ UPDATE ALL TRIP LISTS
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

      // ✅ DRIVER STATUS CHANGED
      queryClient.invalidateQueries({
        queryKey: FLEET_KEYS.drivers(),
      });

      // ✅ VEHICLE STATUS CHANGED
      queryClient.invalidateQueries({
        queryKey: FLEET_KEYS.vehicles(),
      });

      // ✅ ORDERS FULFILLMENT STATUS CHANGED
      queryClient.invalidateQueries({
        queryKey: ORDER_KEYS.lists(),
      });

      toast.success("Trip dispatched successfully");

      router.push(
        FLEET_ROUTES.tripDetail(updatedTrip.id)
      );
    },

    onError: (err: any) => {
      toast.error(
        err?.message ?? "Failed to dispatch trip"
      );
    },
  });
}