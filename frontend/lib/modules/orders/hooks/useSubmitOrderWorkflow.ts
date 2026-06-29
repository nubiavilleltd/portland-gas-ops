// hooks/useSubmitOrderWorkflow.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ORDER_KEYS } from "../constants/query-keys";
import { ORDER_ROUTES } from "../constants/routes";
import type { CreateOrderInput, Order } from "../types/orders.types";
import { submitOrderWorkflow } from "../workflows/submit-order-workflow";

export function useSubmitOrderWorkflow() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({
      input,
      existingDraftId,
    }: {
      input: CreateOrderInput;
      existingDraftId?: string;
    }) => submitOrderWorkflow(input, existingDraftId),

    onSuccess: (order) => {
      queryClient.setQueryData(ORDER_KEYS.detail(order.id), order);
      queryClient.setQueriesData(
        { queryKey: ORDER_KEYS.lists() },
        (old?: Order[]) => {
          if (!old) return [order];
          const exists = old.find((o) => o.id === order.id);
          return exists
            ? old.map((o) => (o.id === order.id ? order : o))
            : [...old, order];
        }
      );
      toast.success("Order submitted successfully");
     router.push(
          ORDER_ROUTES.list()
        );
    },

    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to submit order");
    },
  });
}