// hooks/useSaveDraftOrderWorkflow.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ORDER_KEYS } from "../constants/query-keys";
import type { Order, SaveDraftInput } from "../types/orders.types";
import { saveDraftOrderWorkflow } from "../workflows/save-draft-order.workflow";

export function useSaveDraftOrderWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      input,
      existingDraftId,
    }: {
      input: SaveDraftInput;
      existingDraftId?: string;
    }) => saveDraftOrderWorkflow(input, existingDraftId),

    onSuccess: (savedOrder) => {
      queryClient.setQueryData(ORDER_KEYS.detail(savedOrder.id), savedOrder);
      queryClient.setQueriesData(
        { queryKey: ORDER_KEYS.lists() },
        (old?: Order[]) => {
          if (!old) return [savedOrder];
          const exists = old.find((o) => o.id === savedOrder.id);
          return exists
            ? old.map((o) => (o.id === savedOrder.id ? savedOrder : o))
            : [...old, savedOrder];
        }
      );
    },
  });
}