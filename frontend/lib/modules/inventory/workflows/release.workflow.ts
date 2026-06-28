import { InventoryService } from "../services/inventory.service";

export type ReleaseItemsInput = {
  item_ids: string[];
  recorded_by: string;
};

export async function releaseItemsWorkflow(input: ReleaseItemsInput): Promise<void> {
  if (input.item_ids.length === 0) return;
  await InventoryService.releaseReservedItems(input.item_ids, input.recorded_by);
}