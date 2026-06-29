// hooks/useConfirmOrderWorkflow.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ORDER_KEYS } from "../constants/query-keys";
import type { Order } from "../types/orders.types";
import { confirmOrderWorkflow } from "../workflows/confirmOrder.workflow";
import { ORDER_ROUTES } from "../constants/routes";

export function useConfirmOrderWorkflow(order?: Order) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      if (!order) throw new Error("Order not loaded");
      return confirmOrderWorkflow(order);
    },


    onSuccess: (updatedOrder) => {
      // ✅ SINGLE ORDER CACHE
      queryClient.setQueryData(
        ORDER_KEYS.detail(updatedOrder.id),
        updatedOrder,
      );

      // ✅ UPDATE ALL ORDER LISTS
      queryClient.setQueriesData(
        { queryKey: ORDER_KEYS.lists() },
        (old?: Order[]) =>
          old?.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)),
      );

      toast.success("Order confirmed successfully");

      router.push(ORDER_ROUTES.detail(updatedOrder.order_number));
    },

    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to confirm order");
    },
  });
}
