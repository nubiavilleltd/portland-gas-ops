import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { INVENTORY_KEYS } from "../constants/inventory-query-keys";
import { checkInTrackedWorkflow, checkInConsumableWorkflow } from "../workflows/checkIn.workflow";
import { reserveItemsWorkflow } from "../workflows/reserve.workflow";
import { checkOutItemsWorkflow } from "../workflows/checkOut.workflow";
import { returnItemWorkflow } from "../workflows/return.workflow";
import type {
  CheckInTrackedInput,
  CheckInConsumableInput,
  ReserveItemsInput,
  CheckOutItemsInput,
  ReturnItemInput,
} from "../types/inventory.types";

export function useCheckInTracked() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CheckInTrackedInput) =>
      checkInTrackedWorkflow(input),

    onSuccess: (newItems) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.items() });
      queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.movements() });
      toast.success(`${newItems.length} item(s) checked in successfully`);
    },

    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to check in items");
    },
  });
}

export function useCheckInConsumable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CheckInConsumableInput) =>
      checkInConsumableWorkflow(input),

    onSuccess: (_, input) => {
      queryClient.invalidateQueries({
        queryKey: INVENTORY_KEYS.consumableStockByProduct(input.product_id),
      });
      queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.consumableStock() });
      queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.movements() });
      toast.success("Stock updated successfully");
    },

    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to update stock");
    },
  });
}

export function useReserveItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReserveItemsInput) =>
      reserveItemsWorkflow(input),

    onSuccess: (reservedItems) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.items() });
      queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.movements() });
      toast.success(`${reservedItems.length} item(s) reserved`);
    },

    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to reserve items");
    },
  });
}

export function useCheckOutItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CheckOutItemsInput) =>
      checkOutItemsWorkflow(input),

    onSuccess: (checkedOutItems) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.items() });
      queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.movements() });
      toast.success(`${checkedOutItems.length} item(s) checked out`);
    },

    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to check out items");
    },
  });
}

export function useReturnItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReturnItemInput) =>
      returnItemWorkflow(input),

    onSuccess: (returnedItem) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.items() });
      queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.movements() });
      toast.success(`Item ${returnedItem.tag_number} returned successfully`);
    },

    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to return item");
    },
  });
}