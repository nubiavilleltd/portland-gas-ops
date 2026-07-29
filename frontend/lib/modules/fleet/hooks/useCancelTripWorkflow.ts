"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cancelTripWorkflow } from "../workflows/cancelTrip.workflow";
import { FLEET_KEYS } from "../constants/query-keys";
import { ORDER_KEYS } from "@/lib/modules/orders/constants/query-keys";
import { INVENTORY_KEYS } from "@/lib/modules/inventory/constants/inventory-query-keys";
import { FLEET_ROUTES } from "../constants/routes";
import type { Trip } from "../types/trip.types";
import { AUDIT_KEYS } from "../../audit/constants/query-keys";

export function useCancelTripWorkflow() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ trip, reason }: { trip: Trip; reason?: string }) =>
      cancelTripWorkflow(trip, reason),

    onSuccess: (updatedTrip) => {
      queryClient.setQueryData(FLEET_KEYS.trip(updatedTrip.id), updatedTrip);
      queryClient.invalidateQueries({ queryKey: FLEET_KEYS.trips() });
      queryClient.invalidateQueries({ queryKey: FLEET_KEYS.drivers() });
      queryClient.invalidateQueries({ queryKey: FLEET_KEYS.vehicles() });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.items() });
      queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.movements() });
      queryClient.invalidateQueries({
        queryKey: AUDIT_KEYS.entity("trip", updatedTrip.id),
      });
      toast.success("Trip cancelled");
      router.push(FLEET_ROUTES.tripDetail(updatedTrip.id));
    },

    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to cancel trip");
    },
  });
}