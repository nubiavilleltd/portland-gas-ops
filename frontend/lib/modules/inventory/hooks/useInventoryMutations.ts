import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { InventoryService } from "../services/inventory.service";
import { getErrorMessage } from "@/lib/api/error";
import { INVENTORY_ROUTES } from "../constants/routes";
import { INVENTORY_KEYS } from "../constants/inventory-query-keys";

export function useCheckInIndividualItems() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: InventoryService.checkInIndividualItems,

    onSuccess: (items) => {
      queryClient.invalidateQueries({
        queryKey: INVENTORY_KEYS.items(),
      });

      queryClient.invalidateQueries({
        queryKey: INVENTORY_KEYS.movements(),
      });

      queryClient.invalidateQueries({
        queryKey: INVENTORY_KEYS.kpis(),
      });

      queryClient.invalidateQueries({
        queryKey: INVENTORY_KEYS.overview(),
      });

      toast.success(
        `${items.length} item(s) checked in successfully`,
      );

      router.push(INVENTORY_ROUTES.list());
    },

    onError: (err) => {
      toast.error(getErrorMessage(err, "Failed to check in items"));
    },
  });
}

export function useCheckInStockQuantity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: InventoryService.checkInStockQuantity,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: INVENTORY_KEYS.consumableStock(),
      });

      queryClient.invalidateQueries({
        queryKey: INVENTORY_KEYS.movements(),
      });

      queryClient.invalidateQueries({
        queryKey: INVENTORY_KEYS.kpis(),
      });

      queryClient.invalidateQueries({
        queryKey: INVENTORY_KEYS.overview(),
      });

      toast.success("Stock updated successfully");
    },

    onError: (err) => {
      toast.error(getErrorMessage(err, "Failed to update stock"));
    },
  });
}

export function useReturnItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: InventoryService.returnItem,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: INVENTORY_KEYS.items(),
      });

      queryClient.invalidateQueries({
        queryKey: INVENTORY_KEYS.movements(),
      });

      queryClient.invalidateQueries({
        queryKey: INVENTORY_KEYS.kpis(),
      });

      queryClient.invalidateQueries({
        queryKey: INVENTORY_KEYS.overview(),
      });

      toast.success("Item returned successfully");
    },

    onError: (err) => {
      toast.error(getErrorMessage(err, "Failed to return item"));
    },
  });
}