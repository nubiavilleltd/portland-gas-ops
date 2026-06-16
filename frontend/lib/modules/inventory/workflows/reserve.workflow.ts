import { InventoryService } from "../services/inventory.service";
import { canReserve } from "../guards/inventory.guards";
import type { ReserveItemsInput, InventoryItem } from "../types/inventory.types";

export async function reserveItemsWorkflow(
  input: ReserveItemsInput
): Promise<InventoryItem[]> {
  // Guard check — all items must be available
  const allItems = await Promise.all(
    input.item_ids.map((id) => InventoryService.getItemById(id))
  );

  for (const item of allItems) {
    if (!item) throw new Error("Inventory item not found");
    if (!canReserve(item)) {
      throw new Error(
        `Item ${item.tag_number} cannot be reserved (status: ${item.status})`
      );
    }
  }

  return InventoryService.reserveItems(input);
}