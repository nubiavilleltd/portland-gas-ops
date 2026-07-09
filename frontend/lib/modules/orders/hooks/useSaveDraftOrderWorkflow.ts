// hooks/useSaveDraftOrderWorkflow.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ORDER_KEYS } from "../constants/query-keys";
import type { CreateOrderInput, Order } from "../types/orders.types";
import { saveDraftOrderWorkflow } from "../workflows/save-draft-order.workflow";
import { ORDER_ROUTES } from "../constants/routes";
import { useRouter } from "next/navigation";

export function useSaveDraftOrderWorkflow() {
  const queryClient = useQueryClient();
  const router = useRouter()

  return useMutation({
    mutationFn: ({
      input,
      existingDraftNo,
    }: {
      input: CreateOrderInput;
      existingDraftNo?: string;
    }) => saveDraftOrderWorkflow(input, existingDraftNo),

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
      toast.success("Draft saved successfully");
      router.push(
          ORDER_ROUTES.list()
        );
    },

    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to save draft");
    },
  });
}