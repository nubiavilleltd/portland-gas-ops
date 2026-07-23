import { inventoryApi } from "../api/inventory.api";
import {
  adaptInventoryItem,
  adaptConsumableStock,
  adaptStockMovement,
  adaptConsumableStockDetail,
} from "../adapters/inventory.adapter";
import { getErrorMessage } from "@/lib/api/error";
import type {
  InventoryItem, ConsumableStock,
  StockMovement, WarehouseLocation,
  ConsumableStockDetail,
} from "../types/inventory.types";

export class InventoryService {

  static async getLocations(): Promise<WarehouseLocation[]> {
    const raw = await inventoryApi.getLocations();
    return raw;
  }

  static async getDefaultLocation(): Promise<WarehouseLocation | undefined> {
    const locations = await InventoryService.getLocations();
    return locations.find((l: WarehouseLocation) => l.is_default);
  }

 static async getItems(): Promise<InventoryItem[]> {
  const raw = await inventoryApi.listItems();

  return raw.map(adaptInventoryItem);
}

  static async getItemById(id: string): Promise<InventoryItem | undefined> {
    try {
      const raw = await inventoryApi.getItem(id);
      return adaptInventoryItem(raw);
    } catch { return undefined; }
  }

  static async getConsumableStock(): Promise<ConsumableStock[]> {
    const raw = await inventoryApi.listStock();
    return raw.map(adaptConsumableStock);
  }

static async getConsumableStockById(
  id: string,
): Promise<ConsumableStockDetail> {
  const raw = await inventoryApi.getStock(id);
  return adaptConsumableStockDetail(raw);
}

  static async getConsumableStockByProduct(productId: string): Promise<ConsumableStock | undefined> {
    const all = await InventoryService.getConsumableStock();
    return all.find(s => s.product_id === productId);
  }

  static async getConsumableStockLevel(productId: string): Promise<number> {
    const stock = await InventoryService.getConsumableStockByProduct(productId);
    return stock?.quantity ?? 0;
  }

  static async getMovements(params: { product_id?: string; item_id?: string } = {}): Promise<StockMovement[]> {
    const raw = await inventoryApi.listMovements(params);
    return raw.map(adaptStockMovement);
  }

  static async getMovementsByProduct(productId: string): Promise<StockMovement[]> {
    return InventoryService.getMovements({ product_id: productId });
  }

  static async checkInTracked(input: {
    product_id: string;
    location_id: string;
    quantity: number;
    condition: string;
    notes?: string;
    product_code?: string;
    recorded_by?: string;
  }): Promise<InventoryItem[]> {
    try {
      const raw = await inventoryApi.checkInTracked({
        product_id:  input.product_id,
        location_id: input.location_id,
        quantity:    input.quantity,
        condition:   input.condition,
        notes:       input.notes,
      });
      return raw.map(adaptInventoryItem);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to check in items"));
    }
  }

  static async checkInConsumable(input: {
    product_id: string;
    location_id: string;
    quantity: number;
    notes?: string;
    recorded_by?: string;
  }): Promise<ConsumableStock> {
    try {
      const raw = await inventoryApi.checkInConsumable({
        product_id:  input.product_id,
        location_id: input.location_id,
        quantity:    input.quantity,
        notes:       input.notes,
      });
      return adaptConsumableStock(raw);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to check in stock"));
    }
  }

  static async returnItem(input: {
    item_id: string;
    condition: string;
    notes?: string;
    recorded_by?: string;
  }): Promise<InventoryItem> {
    try {
      const raw = await inventoryApi.returnItem(input.item_id, {
        condition: input.condition,
        notes:     input.notes,
      });
      return adaptInventoryItem(raw);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to return item"));
    }
  }


}


