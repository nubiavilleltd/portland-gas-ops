import { inventoryApi } from "../api/inventory.api";
import {
  adaptInventoryItem,
  adaptConsumableStock,
  adaptStockMovement,
  adaptConsumableStockDetail,
  adaptProductAvailability,
  adaptInventoryOverviewList,
} from "../adapters/inventory.adapter";
import { getErrorMessage } from "@/lib/api/error";
import type {
  InventoryItem,
  ConsumableStock,
  StockMovement,
  WarehouseLocation,
  ConsumableStockDetail,
  ProductAvailability,
  InventoryOverviewList,
} from "../types/inventory.types";

export class InventoryService {
  // ── Locations ────────────────────────────────────────────

  static async getLocations(): Promise<WarehouseLocation[]> {
    const raw = await inventoryApi.getLocations();
    return raw;
  }

  static async getDefaultLocation(): Promise<
    WarehouseLocation | undefined
  > {
    const locations = await InventoryService.getLocations();
    return locations.find((l: WarehouseLocation) => l.is_default);
  }

  // ── Overview ─────────────────────────────────────────────

  static async getOverview(filters?: {
    search?: string;
    inventoryTracking?: "INDIVIDUAL_ITEMS" | "STOCK_QUANTITY";
    categoryId?: string;
    stockStatus?: "ok" | "low" | "out";
    page?: number;
    pageSize?: number;
  }): Promise<InventoryOverviewList> {
    try {
      const raw = await inventoryApi.getOverview({
        search: filters?.search,
        inventory_tracking: filters?.inventoryTracking,
        category_id: filters?.categoryId,
        stock_status: filters?.stockStatus,
        page: filters?.page,
        page_size: filters?.pageSize,
      });
      return adaptInventoryOverviewList(raw);
    } catch (err) {
      throw new Error(
        getErrorMessage(err, "Failed to fetch inventory overview"),
      );
    }
  }

  static async getProductAvailability(
    productId: string,
  ): Promise<ProductAvailability> {
    try {
      const raw = await inventoryApi.getProductAvailability(productId);
      return adaptProductAvailability(raw);
    } catch (err) {
      throw new Error(
        getErrorMessage(err, "Failed to fetch product availability"),
      );
    }
  }

  // ── Individual items ─────────────────────────────────────

  static async getItems(): Promise<InventoryItem[]> {
    const raw = await inventoryApi.listItems();
    return raw.map(adaptInventoryItem);
  }

  static async getItemById(
    id: string,
  ): Promise<InventoryItem | undefined> {
    try {
      const raw = await inventoryApi.getItem(id);
      return adaptInventoryItem(raw);
    } catch {
      return undefined;
    }
  }


    static async getItemsForProduct(
    productId: string,
  ): Promise<InventoryItem[]> {
    const raw = await inventoryApi.listItems({ product_id: productId });
    return raw.map(adaptInventoryItem);
  }

  static async getConsumableStockForProduct(
    productId: string,
  ): Promise<ConsumableStock[]> {
    const raw = await inventoryApi.listStock({ product_id: productId });
    return raw.map(adaptConsumableStock);
  }

  static async getMovementsForProduct(
    productId: string,
  ): Promise<StockMovement[]> {
    const raw = await inventoryApi.listMovements({ product_id: productId });
    return raw.map(adaptStockMovement);
  }

  // ── Stock quantity ───────────────────────────────────────

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

  static async getConsumableStockByProduct(
    productId: string,
  ): Promise<ConsumableStock | undefined> {
    const all = await InventoryService.getConsumableStock();
    return all.find((s) => s.product_id === productId);
  }

  static async getConsumableStockLevel(
    productId: string,
  ): Promise<number> {
    const stock =
      await InventoryService.getConsumableStockByProduct(productId);
    return stock?.quantity ?? 0;
  }

  static async getConsumableLocations(
    productId: string,
  ): Promise<
    {
      location_id: string;
      location_name: string;
      available_quantity: number;
    }[]
  > {
    return inventoryApi.getConsumableLocations(productId);
  }

  // ── Movements ────────────────────────────────────────────

  static async getMovements(
    params: { product_id?: string; item_id?: string } = {},
  ): Promise<StockMovement[]> {
    const raw = await inventoryApi.listMovements(params);
    return raw.map(adaptStockMovement);
  }

  static async getMovementsByProduct(
    productId: string,
  ): Promise<StockMovement[]> {
    return InventoryService.getMovements({ product_id: productId });
  }

  // ── Check-in ─────────────────────────────────────────────

  static async checkInIndividualItems(input: {
    product_id: string;
    location_id: string;
    quantity: number;
    condition: string;
    notes?: string;
  }): Promise<InventoryItem[]> {
    try {
      const raw = await inventoryApi.checkInIndividualItems(input);
      return raw.map(adaptInventoryItem);
    } catch (err) {
      throw new Error(
        getErrorMessage(err, "Failed to check in items"),
      );
    }
  }

  static async checkInStockQuantity(input: {
    product_id: string;
    location_id: string;
    quantity: number;
    notes?: string;
  }): Promise<ConsumableStock> {
    try {
      const raw = await inventoryApi.checkInStockQuantity(input);
      return adaptConsumableStock(raw);
    } catch (err) {
      throw new Error(
        getErrorMessage(err, "Failed to check in stock"),
      );
    }
  }

  // ── Returns ──────────────────────────────────────────────

  static async returnItem(input: {
    item_id: string;
    condition: string;
    notes?: string;
  }): Promise<InventoryItem> {
    try {
      const raw = await inventoryApi.returnItem(input.item_id, {
        condition: input.condition,
        notes: input.notes,
      });
      return adaptInventoryItem(raw);
    } catch (err) {
      throw new Error(
        getErrorMessage(err, "Failed to return item"),
      );
    }
  }
}