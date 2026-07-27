import { InventoryService } from "../services/inventory.service";
import { canCheckOut } from "../guards/inventory.guards";
import type { CheckOutItemsInput, InventoryItem } from "../types/inventory.types";

export async function checkOutItemsWorkflow(
  input: CheckOutItemsInput
): Promise<InventoryItem[]> {
  const allItems = await Promise.all(
    input.item_ids.map((id) => InventoryService.getItemById(id))
  );

  for (const item of allItems) {
    if (!item) throw new Error("Inventory item not found");
    if (!canCheckOut(item)) {
      throw new Error(
        `Item ${item.tag_number} cannot be checked out (status: ${item.status})`
      );
    }
  }

  return InventoryService.checkOutItems(input);
}