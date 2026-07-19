// hooks/useSubmitOrderWorkflow.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ORDER_KEYS } from "../constants/query-keys";
import type { CreateOrderInput, Order } from "../types/orders.types";
import { submitOrderWorkflow } from "../workflows/submit-order-workflow";

export function useSubmitOrderWorkflow() {
  const queryClient = useQueryClient();

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
  
    },
  });
}