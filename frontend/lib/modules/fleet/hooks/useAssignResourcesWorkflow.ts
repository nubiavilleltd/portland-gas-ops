"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
    assignResourcesWorkflow,
    type AssignResourcesInput,
} from "../workflows/assign-trip-resources.workflow";
import { useRouter } from "next/navigation";
import { Trip } from "../types/trip.types";
import { FLEET_KEYS } from "../constants/query-keys";
import { ORDER_KEYS } from "@/lib/query-keys";

export function useAssignResourcesWorkflow() {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: (input: AssignResourcesInput) =>
            assignResourcesWorkflow(input),

        onSuccess: (trip: Trip) => {
            // 2. WRITE THROUGH CACHE
            queryClient.setQueryData(
                FLEET_KEYS.trip(trip.id),
                trip
            );

            // 3. INVALIDATE TRIPS
            queryClient.invalidateQueries({
                queryKey: FLEET_KEYS.trips(),
            });

            // 4. DRIVER + VEHICLE STATUS CHANGED
            queryClient.invalidateQueries({
                queryKey: FLEET_KEYS.drivers(),
            });

            queryClient.invalidateQueries({
                queryKey: FLEET_KEYS.vehicles(),
            });

            // 5. ORDERS ALSO CHANGED TO ASSIGNED
            queryClient.invalidateQueries({
                queryKey: ORDER_KEYS.list(),
            });
            toast.success("Driver and vehicle assigned successfully");
            router.push(`/fleet/trips/${trip.id}`);
        },

        onError: (err: any) => {
            toast.error(
                err?.message ??
                "Failed to assign driver and vehicle"
            );
        },
    });
}