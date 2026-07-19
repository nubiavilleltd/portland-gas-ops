"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { confirmDeliveryWorkflow } from "../workflows/confirm-delivery.workflow";
import { ORDER_KEYS } from "../constants/query-keys";

import type { Order } from "../types/orders.types";
import { useRouter } from "next/navigation";
import { ORDER_ROUTES } from "../constants/routes";

export function useConfirmDeliveryWorkflow() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (order: Order) => confirmDeliveryWorkflow(order),

    onSuccess: (updatedOrder) => {
      // ✅ single order cache
      queryClient.setQueryData(
        ORDER_KEYS.detail(updatedOrder.id),
        updatedOrder,
      );

      // ✅ sync list
      queryClient.setQueriesData(
        { queryKey: ORDER_KEYS.lists() },
        (old: Order[] | undefined) => {
          if (!Array.isArray(old)) return old;

          return old.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
        },
      );

      toast.success("Delivery confirmed");
      router.push(ORDER_ROUTES.detail(updatedOrder.id));
    },

    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to confirm delivery");
    },
  });
}
