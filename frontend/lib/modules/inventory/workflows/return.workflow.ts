import { InventoryService } from "../services/inventory.service";
import { canReturn } from "../guards/inventory.guards";
import type { ReturnItemInput, InventoryItem } from "../types/inventory.types";

export async function returnItemWorkflow(
  input: ReturnItemInput
): Promise<InventoryItem> {
  const item = await InventoryService.getItemById(input.item_id);

  if (!item) throw new Error("Inventory item not found");
  if (!canReturn(item)) {
    throw new Error(
      `Item ${item.tag_number} cannot be returned (status: ${item.status}, disposition: ${item.disposition})`
    );
  }

  return InventoryService.returnItem(input);
}