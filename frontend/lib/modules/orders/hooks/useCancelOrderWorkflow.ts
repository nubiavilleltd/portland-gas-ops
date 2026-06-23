"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cancelOrderWorkflow } from "../workflows/cancelOrder.workflow";
import { ORDER_KEYS } from "../constants/query-keys";
import { ORDER_ROUTES } from "../constants/routes";
import type { Order } from "../types/orders.types";

export function useCancelOrderWorkflow() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ order, reason }: { order: Order; reason?: string }) =>
      cancelOrderWorkflow(order, reason),

    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(ORDER_KEYS.detail(updatedOrder.id), updatedOrder);
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.lists() });
      toast.success("Order cancelled");
      router.push(ORDER_ROUTES.detail(updatedOrder.id));
    },

    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to cancel order");
    },
  });
}