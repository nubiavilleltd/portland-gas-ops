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

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreateTripInput } from "../types/trip.types";
import { createTripWorkflow } from "../workflows/create-trip.workflow";


export function useCreateTripWorkflow() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: CreateTripInput) =>
      createTripWorkflow({ input, queryClient }),

    onSuccess: (trip) => {
      toast.success("Trip created successfully");
    //   router.push(`/fleet/trips/${trip.id}`);

      setTimeout(() => {
    router.push(`/fleet/trips/${trip.id}`);
  }, 100);
    },

    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to create trip");
    },
  });
}