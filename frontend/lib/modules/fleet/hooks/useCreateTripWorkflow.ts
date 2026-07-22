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
