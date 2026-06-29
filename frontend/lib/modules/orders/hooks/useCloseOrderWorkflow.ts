"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { closeOrderWorkflow } from "../workflows/close-order.workflow";
import { ORDER_KEYS } from "../constants/query-keys";

import type { Order } from "../types/orders.types";

export function useCloseOrderWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (order: Order) => closeOrderWorkflow(order),

    onSuccess: (updatedOrder) => {
      // ✅ update single order
      queryClient.setQueryData(
        ORDER_KEYS.detail(updatedOrder.id),
        updatedOrder,
      );

      // ✅ sync order list
      queryClient.setQueriesData(
        { queryKey: ORDER_KEYS.lists() },
        (old: Order[] | undefined) => {
          if (!Array.isArray(old)) return old;

          return old.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
        },
      );

      toast.success("Order closed successfully");
    },

    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to close order");
    },
  });
}
