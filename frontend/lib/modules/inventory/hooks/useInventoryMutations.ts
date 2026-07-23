import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { inventoryApi } from "../api/inventory.api";
import { adaptInventoryItem, adaptConsumableStock } from "../adapters/inventory.adapter";
import { getErrorMessage } from "@/lib/api/error";
import { INVENTORY_ROUTES } from "../constants/routes";
import { INVENTORY_KEYS } from "../constants/inventory-query-keys";
import { InventoryService } from "../services/inventory.service";



export function useCheckInTracked() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: InventoryService.checkInTracked,

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

      toast.success(`${items.length} item(s) checked in successfully`);

      router.push(INVENTORY_ROUTES.list());
    },

    onError: (err) => {
      toast.error(getErrorMessage(err, "Failed to check in items"));
    },
  });
}

export function useCheckInConsumable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: InventoryService.checkInConsumable,

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

      toast.success("Item returned successfully");
    },

    onError: (err) => {
      toast.error(getErrorMessage(err, "Failed to return item"));
    },
  });
}