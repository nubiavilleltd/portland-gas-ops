import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { inventoryApi } from "../api/inventory.api";
import { adaptInventoryItem, adaptConsumableStock } from "../adapters/inventory.adapter";
import { getErrorMessage } from "@/lib/api/error";
import { INVENTORY_ROUTES } from "../constants/routes";

const INVENTORY_KEYS = {
  items:     ["inventory", "items"],
  stock:     ["inventory", "stock"],
  movements: ["inventory", "movements"],
  kpis:      ["inventory", "kpis"],
};

export function useCheckInTracked() {
  const queryClient = useQueryClient();
  const router      = useRouter();

  return useMutation({
    mutationFn: (input: {
      product_id: string; location_id: string; quantity: number;
      condition: string; notes?: string; product_code?: string; recorded_by?: string;
    }) => inventoryApi.checkInTracked(input).then((r: any[]) => r.map(adaptInventoryItem)),

    onSuccess: (items) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.items });
      queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.movements });
      queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.kpis });
      toast.success(`${items.length} item(s) checked in successfully`);
      router.push(INVENTORY_ROUTES.list());
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err, "Failed to check in items"));
    },
  });
}

export function useCheckInConsumable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      product_id: string; location_id: string; quantity: number;
      notes?: string; recorded_by?: string;
    }) => inventoryApi.checkInConsumable(input).then(adaptConsumableStock),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.stock });
      queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.movements });
      toast.success("Stock updated successfully");
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err, "Failed to update stock"));
    },
  });
}

export function useReturnItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ item_id, condition, notes }: {
      item_id: string | number; condition: string; notes?: string; recorded_by?: string;
    }) => inventoryApi.returnItem(Number(item_id), { condition, notes }).then(adaptInventoryItem),

    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.items });
      queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.movements });
      queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.kpis });
      toast.success("Item returned successfully");
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err, "Failed to return item"));
    },
  });
}