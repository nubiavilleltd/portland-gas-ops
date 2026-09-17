import { InventoryService } from "../services/inventory.service";
import type {
  CheckInIndividualItemsInput,
  CheckInStockQuantityInput,
  InventoryItem,
  ConsumableStock,
} from "../types/inventory.types";

export async function checkInIndividualItemsWorkflow(
  input: CheckInIndividualItemsInput,
): Promise<InventoryItem[]> {
  return InventoryService.checkInIndividualItems(input);
}

export async function checkInStockQuantityWorkflow(
  input: CheckInStockQuantityInput,
): Promise<ConsumableStock> {
  return InventoryService.checkInStockQuantity(input);
}