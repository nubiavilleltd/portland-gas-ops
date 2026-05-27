"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  assignResourcesWorkflow,
  type AssignResourcesInput,
} from "../workflows/assign-trip-resources.workflow";

export function useAssignResourcesWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AssignResourcesInput) =>
      assignResourcesWorkflow({
        input,
        queryClient,
      }),

    onSuccess: () => {
      toast.success("Driver and vehicle assigned successfully");
    },

    onError: (err: any) => {
      toast.error(
        err?.message ??
          "Failed to assign driver and vehicle"
      );
    },
  });
}