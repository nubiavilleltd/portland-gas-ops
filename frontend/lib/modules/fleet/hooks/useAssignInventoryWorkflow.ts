"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { assignInventoryWorkflow, type AssignInventoryInput } from "../workflows/assign-inventory.workflow";
import { FLEET_KEYS } from "../constants/query-keys";
import { ORDER_KEYS } from "@/lib/modules/orders/constants/query-keys";
import { INVENTORY_KEYS } from "@/lib/modules/inventory/constants/inventory-query-keys";
import { FLEET_ROUTES } from "../constants/routes";
import type { Trip } from "../types/trip.types";
import { AUDIT_KEYS } from "../../audit/constants/query-keys";

export function useAssignInventoryWorkflow() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: AssignInventoryInput) => assignInventoryWorkflow(input),

    onSuccess: (updatedTrip: Trip) => {
      queryClient.setQueryData(FLEET_KEYS.trip(updatedTrip.id), updatedTrip);
      queryClient.setQueriesData(
        { queryKey: FLEET_KEYS.trips() },
        (old: Trip[] | undefined) => {
          if (!Array.isArray(old)) return old;
          return old.map((t) => t.id === updatedTrip.id ? updatedTrip : t);
        }
      );
      queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.items() });
      queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.movements() });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: AUDIT_KEYS.entity("trip", updatedTrip.id),
      });

      toast.success("Inventory assigned — trip is ready to dispatch");
      router.push(FLEET_ROUTES.tripDetail(updatedTrip.id));
    },

    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to assign inventory");
    },
  });
}