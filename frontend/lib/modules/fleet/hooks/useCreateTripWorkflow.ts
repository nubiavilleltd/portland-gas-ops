// import { useMutation } from "@tanstack/react-query";
// import { useRouter } from "next/navigation";
// import { toast } from "sonner";

// import {
//   createTripWorkflow,
// } from "../workflows/create-trip.workflow";

// import { FLEET_KEYS } from "../constants/query-keys";
// import { CreateTripInput } from "../types/trip.types";

// export function useCreateTripWorkflow() {
//   const router = useRouter();

//   return useMutation({
//     mutationFn: (data: CreateTripInput) =>
//       createTripWorkflow(data),

//     onSuccess: (trip) => {
//       toast.success("Trip created successfully");

//       router.push(`/fleet/trips/${trip.id}`);
//     },
//   });
// }




"use client";


import { CreateTripInput } from "../types/trip.types";
import { createTripWorkflow } from "../workflows/create-trip.workflow";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { FLEET_KEYS } from "../constants/query-keys";
import { ORDER_KEYS } from "@/lib/modules/orders/constants/query-keys";

import type { Trip } from "../types/trip.types";
import { FLEET_ROUTES } from "../constants/routes";

export function useCreateTripWorkflow() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: CreateTripInput) => createTripWorkflow(input),

    // onSuccess: (trip: Trip) => {
    //   // ✅ SINGLE TRIP CACHE (NO FLICKER)
    //   queryClient.setQueryData(
    //     FLEET_KEYS.trip(trip.id),
    //     trip
    //   );

    //   // ✅ LIST SYNC
    //   queryClient.setQueryData(
    //     FLEET_KEYS.trips(),
    //     (old?: Trip[]) =>
    //       old?.some((t) => t.id === trip.id)
    //         ? old
    //         : [trip, ...(old ?? [])]
    //   );

    //   // ✅ ORDERS UPDATED VIA SERVICE → REFRESH UI
    //   queryClient.invalidateQueries({
    //     queryKey: ORDER_KEYS.list(),
    //   });

    //   toast.success("Trip created successfully");

    //   router.push(FLEET_ROUTES.tripDetail(trip.id));
    // },


//     onSuccess: (trip: Trip) => {
//   // ✅ SINGLE TRIP CACHE
//   queryClient.setQueryData(
//     FLEET_KEYS.trip(trip.id),
//     trip
//   );

//   // ✅ TRIPS LIST CACHE
//   queryClient.setQueryData(
//     FLEET_KEYS.trips(),
//     (old?: Trip[]) =>
//       old?.some((t) => t.id === trip.id)
//         ? old
//         : [trip, ...(old ?? [])]
//   );

//   // ✅ REFRESH ALL ORDER LISTS
//   queryClient.invalidateQueries({
//     queryKey: ORDER_KEYS.lists(),
//   });

//   toast.success("Trip created successfully");

//   router.push(
//     FLEET_ROUTES.tripDetail(trip.id)
//   );
// },

onSuccess: (trip: Trip) => {
  queryClient.setQueryData(FLEET_KEYS.trip(trip.id), trip);
  queryClient.invalidateQueries({ queryKey: FLEET_KEYS.trips() });
  queryClient.invalidateQueries({ queryKey: ORDER_KEYS.lists() });

  toast.success("Trip created successfully");
  router.push(FLEET_ROUTES.tripDetail(trip.id));
},
    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to create trip");
    },
  });
}






// export function useCreateTripWorkflow() {
//   const queryClient = useQueryClient();
//   const router = useRouter();

//   return useMutation({
//     mutationFn: (input: CreateTripInput) =>
//       createTripWorkflow({ input, queryClient }),

//     onSuccess: (trip) => {
//       toast.success("Trip created successfully");
//     //   router.push(`/fleet/trips/${trip.id}`);

//       setTimeout(() => {
//     router.push(`/fleet/trips/${trip.id}`);
//   }, 100);
//     },

//     onError: (err: any) => {
//       toast.error(err?.message ?? "Failed to create trip");
//     },
//   });
// }
// export function useCreateTripWorkflow() {
//   const queryClient = useQueryClient();
//   const router = useRouter();

//   return useMutation({
//     mutationFn: (input: CreateTripInput) =>
//       createTripWorkflow({ input, queryClient }),

//     onSuccess: (trip) => {
//       toast.success("Trip created successfully");
//     //   router.push(`/fleet/trips/${trip.id}`);

//       setTimeout(() => {
//     router.push(`/fleet/trips/${trip.id}`);
//   }, 100);
//     },

//     onError: (err: any) => {
//       toast.error(err?.message ?? "Failed to create trip");
//     },
//   });
// }