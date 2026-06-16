import { InventoryService } from "../services/inventory.service";
import type {
  CheckInTrackedInput,
  CheckInConsumableInput,
  InventoryItem,
  ConsumableStock,
} from "../types/inventory.types";

export async function checkInTrackedWorkflow(
  input: CheckInTrackedInput
): Promise<InventoryItem[]> {
  return InventoryService.checkInTracked(input);
}

export async function checkInConsumableWorkflow(
  input: CheckInConsumableInput
): Promise<ConsumableStock> {
  return InventoryService.checkInConsumable(input);
}