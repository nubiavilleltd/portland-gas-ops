// // ============================================================
// //  INVENTORY SERVICE
// //  Single source of truth for all inventory operations.
// //  Handles tracked items and consumable stock separately.
// // ============================================================

// import { inventoryItems } from "../mock/inventory.mock";
// import { stockMovements } from "../mock/movements.mock";
// import { consumableStock } from "../mock/consumable-stock.mock";
// import { locations } from "../mock/locations.mock";

// import type {
//   InventoryItem,
//   InventoryItemStatus,
//   StockMovement,
//   ConsumableStock,
//   WarehouseLocation,
//   CheckInTrackedInput,
//   CheckInConsumableInput,
//   ReserveItemsInput,
//   CheckOutItemsInput,
//   ReturnItemInput,
// } from "../types/inventory.types";

// // ============================================================
// // INTERNAL HELPERS
// // ============================================================

// function getItemOrThrow(id: string): { item: InventoryItem; idx: number } {
//   const idx = inventoryItems.findIndex((i) => i.id === id);
//   if (idx === -1) throw new Error(`Inventory item ${id} not found`);
//   return { item: inventoryItems[idx], idx };
// }

// // function generateTagNumber(productCode: string): string {
// //   const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
// //   const existing = inventoryItems.filter((i) =>
// //     i.tag_number.startsWith(`${productCode}-${date}`)
// //   );
// //   const sequence = String(existing.length + 1).padStart(3, "0");
// //   return `${productCode}-${date}-${sequence}`;
// // }


// function generateTagNumber(productCode: string): string {
//   const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
//   const existing = inventoryItems.filter((i) =>
//     i.tag_number.startsWith(`${productCode}-${date}`)
//   );
//   const sequence = String(existing.length + 1).padStart(3, "0");
//   return `${productCode}-${date}-${sequence}`;
// }

// function recordMovement(movement: Omit<StockMovement, "id" | "created_at">): StockMovement {
//   const newMovement: StockMovement = {
//     ...movement,
//     id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
//     created_at: new Date().toISOString().slice(0, 10),
//   };
//   stockMovements.push(newMovement);
//   return newMovement;
// }

// // ============================================================
// // SERVICE
// // ============================================================

// export class InventoryService {

//   // ── LOCATIONS ───────────────────────────────────────────

//   static async getLocations(): Promise<WarehouseLocation[]> {
//     return Promise.resolve([...locations]);
//   }

//   static async getDefaultLocation(): Promise<WarehouseLocation | undefined> {
//     return Promise.resolve(locations.find((l) => l.is_default));
//   }

//   // ── READ — TRACKED ITEMS ─────────────────────────────────

//   static async getItems(): Promise<InventoryItem[]> {
//     return Promise.resolve([...inventoryItems]);
//   }

//   static async getItemById(id: string): Promise<InventoryItem | undefined> {
//     return Promise.resolve(inventoryItems.find((i) => i.id === id));
//   }

//   static async getItemsByProduct(productId: string): Promise<InventoryItem[]> {
//     return Promise.resolve(
//       inventoryItems.filter((i) => i.product_id === productId)
//     );
//   }

//   static async getAvailableItems(productId: string): Promise<InventoryItem[]> {
//     return Promise.resolve(
//       inventoryItems.filter(
//         (i) => i.product_id === productId && i.status === "available"
//       )
//     );
//   }

//   static async getAvailableCount(productId: string): Promise<number> {
//     const items = await InventoryService.getAvailableItems(productId);
//     return items.length;
//   }

//   static async getItemsByStatus(status: InventoryItemStatus): Promise<InventoryItem[]> {
//     return Promise.resolve(
//       inventoryItems.filter((i) => i.status === status)
//     );
//   }

//   // ── READ — CONSUMABLE STOCK ──────────────────────────────

//   static async getConsumableStock(): Promise<ConsumableStock[]> {
//     return Promise.resolve([...consumableStock]);
//   }

//   static async getConsumableStockByProduct(
//     productId: string
//   ): Promise<ConsumableStock | undefined> {
//     return Promise.resolve(
//       consumableStock.find((s) => s.product_id === productId)
//     );
//   }

//   static async getConsumableStockLevel(productId: string): Promise<number> {
//     const stock = await InventoryService.getConsumableStockByProduct(productId);
//     return stock?.quantity ?? 0;
//   }

//   // ── READ — MOVEMENTS ────────────────────────────────────

//   static async getMovements(): Promise<StockMovement[]> {
//     return Promise.resolve([...stockMovements]);
//   }

//   static async getMovementsByProduct(productId: string): Promise<StockMovement[]> {
//     return Promise.resolve(
//       stockMovements.filter((m) => m.product_id === productId)
//     );
//   }

//   // ── CHECK-IN — TRACKED ───────────────────────────────────

//   static async checkInTracked(input: CheckInTrackedInput): Promise<InventoryItem[]> {
//     // Derive product code from existing items or use product_id prefix
//     // const existingItem = inventoryItems.find(
//     //   (i) => i.product_id === input.product_id
//     // );
//     // const productCode = existingItem
//     //   ? existingItem.tag_number.split("-")[0]
//     //   : input.product_id.toUpperCase().slice(0, 3);
//     const productCode = input.product_code;

//     const newItems: InventoryItem[] = [];

//     for (let i = 0; i < input.quantity; i++) {
//       const newItem: InventoryItem = {
//         id: `inv-item-${Date.now()}-${i}`,
//         product_id: input.product_id,
//         tag_number: generateTagNumber(productCode),
//         serial_number: input.serial_numbers?.[i],
//         status: "available",
//         condition: input.condition,
//         location_id: input.location_id,
//         received_at: new Date().toISOString().slice(0, 10),
//         notes: input.notes,
//       };

//       inventoryItems.push(newItem);
//       newItems.push(newItem);
//     }

//     // Record movement
//     recordMovement({
//       product_id: input.product_id,
//       movement_type: "check_in",
//       quantity: input.quantity,
//       item_ids: newItems.map((i) => i.id),
//       reference_type: "manual",
//       location_id: input.location_id,
//       notes: input.notes,
//       recorded_by: input.recorded_by,
//     });

//     return Promise.resolve(newItems);
//   }

//   // ── CHECK-IN — CONSUMABLE ────────────────────────────────

//   static async checkInConsumable(input: CheckInConsumableInput): Promise<ConsumableStock> {
//     const idx = consumableStock.findIndex(
//       (s) => s.product_id === input.product_id &&
//              s.location_id === input.location_id
//     );

//     if (idx === -1) {
//       // First stock entry for this product at this location
//       const newStock: ConsumableStock = {
//         id: `cstock-${Date.now()}`,
//         product_id: input.product_id,
//         location_id: input.location_id,
//         quantity: input.quantity,
//         updated_at: new Date().toISOString().slice(0, 10),
//       };
//       consumableStock.push(newStock);

//       recordMovement({
//         product_id: input.product_id,
//         movement_type: "check_in",
//         quantity: input.quantity,
//         reference_type: "manual",
//         location_id: input.location_id,
//         notes: input.notes,
//         recorded_by: input.recorded_by,
//       });

//       return Promise.resolve(newStock);
//     }

//     // Increment existing stock
//     consumableStock[idx].quantity += input.quantity;
//     consumableStock[idx].updated_at = new Date().toISOString().slice(0, 10);

//     recordMovement({
//       product_id: input.product_id,
//       movement_type: "check_in",
//       quantity: input.quantity,
//       reference_type: "manual",
//       location_id: input.location_id,
//       notes: input.notes,
//       recorded_by: input.recorded_by,
//     });

//     return Promise.resolve(consumableStock[idx]);
//   }

//   // ── RESERVE ──────────────────────────────────────────────

//   static async reserveItems(input: ReserveItemsInput): Promise<InventoryItem[]> {
//     const reserved: InventoryItem[] = [];

//     for (const itemId of input.item_ids) {
//       const { item, idx } = getItemOrThrow(itemId);

//       if (item.status !== "available") {
//         throw new Error(
//           `Item ${item.tag_number} is not available (status: ${item.status})`
//         );
//       }

//       inventoryItems[idx] = {
//         ...item,
//         status: "reserved",
//         order_id: input.order_id,
//       };

//       reserved.push(inventoryItems[idx]);
//     }

//     recordMovement({
//       product_id: reserved[0].product_id,
//       movement_type: "reservation",
//       quantity: reserved.length,
//       item_ids: input.item_ids,
//       reference_id: input.order_id,
//       reference_type: "order",
//       location_id: reserved[0].location_id,
//       recorded_by: input.recorded_by,
//     });

//     return Promise.resolve(reserved);
//   }

//   // ── CHECK-OUT ────────────────────────────────────────────

//   static async checkOutItems(input: CheckOutItemsInput): Promise<InventoryItem[]> {
//     const checkedOut: InventoryItem[] = [];

//     for (const itemId of input.item_ids) {
//       const { item, idx } = getItemOrThrow(itemId);

//       if (item.status !== "reserved") {
//         throw new Error(
//           `Item ${item.tag_number} must be reserved before check-out (status: ${item.status})`
//         );
//       }

//       inventoryItems[idx] = {
//         ...item,
//         status: "checked_out",
//         disposition: input.disposition,
//         checked_out_at: new Date().toISOString().slice(0, 10),
//       };

//       checkedOut.push(inventoryItems[idx]);
//     }

//     recordMovement({
//       product_id: checkedOut[0].product_id,
//       movement_type: "check_out",
//       quantity: checkedOut.length,
//       item_ids: input.item_ids,
//       reference_id: input.trip_id,
//       reference_type: "trip",
//       location_id: checkedOut[0].location_id,
//       recorded_by: input.recorded_by,
//     });

//     return Promise.resolve(checkedOut);
//   }

//   // ── DECREMENT CONSUMABLE STOCK ───────────────────────────

//   static async decrementConsumableStock(
//     productId: string,
//     locationId: string,
//     quantity: number,
//     tripId: string,
//     recordedBy: string,
//   ): Promise<ConsumableStock> {
//     const idx = consumableStock.findIndex(
//       (s) => s.product_id === productId && s.location_id === locationId
//     );

//     if (idx === -1) {
//       throw new Error(`No stock record found for product ${productId}`);
//     }

//     if (consumableStock[idx].quantity < quantity) {
//       throw new Error(
//         `Insufficient stock. Available: ${consumableStock[idx].quantity}, Required: ${quantity}`
//       );
//     }

//     consumableStock[idx].quantity -= quantity;
//     consumableStock[idx].updated_at = new Date().toISOString().slice(0, 10);

//     recordMovement({
//       product_id: productId,
//       movement_type: "check_out",
//       quantity,
//       reference_id: tripId,
//       reference_type: "trip",
//       location_id: locationId,
//       recorded_by: recordedBy,
//     });

//     return Promise.resolve(consumableStock[idx]);
//   }

//   // ── RETURN ───────────────────────────────────────────────

//   static async returnItem(input: ReturnItemInput): Promise<InventoryItem> {
//     const { item, idx } = getItemOrThrow(input.item_id);

//     if (item.status !== "with_customer") {
//       throw new Error(
//         `Item ${item.tag_number} cannot be returned (status: ${item.status})`
//       );
//     }

//     if (item.disposition !== "loaned") {
//       throw new Error(
//         `Only loaned items can be returned. This item was ${item.disposition}`
//       );
//     }

//     // Determine new status based on condition
//     let newStatus: InventoryItemStatus;
//     if (input.condition === "damaged") {
//       newStatus = "maintenance";
//     } else {
//       newStatus = "available";
//     }

//     inventoryItems[idx] = {
//       ...item,
//       status: newStatus,
//       condition: input.condition,
//       disposition: undefined,
//       order_id: undefined,
//       customer_id: undefined,
//       checked_out_at: undefined,
//       expected_return_date: undefined,
//       notes: input.notes ?? item.notes,
//     };

//     recordMovement({
//       product_id: item.product_id,
//       movement_type: "return",
//       quantity: 1,
//       item_ids: [input.item_id],
//       reference_type: "manual",
//       location_id: item.location_id,
//       notes: input.notes,
//       recorded_by: input.recorded_by,
//     });

//     return Promise.resolve(inventoryItems[idx]);
//   }

//   // ── UPDATE ITEM STATUS ───────────────────────────────────

//   static async updateItemStatus(
//     id: string,
//     status: InventoryItemStatus
//   ): Promise<InventoryItem> {
//     const { item, idx } = getItemOrThrow(id);
//     inventoryItems[idx] = { ...item, status };
//     return Promise.resolve(inventoryItems[idx]);
//   }

//   // ── MARK AS WITH CUSTOMER ────────────────────────────────
//   // Called after delivery confirmation for checked-out items

//   static async markWithCustomer(
//     itemId: string,
//     customerId: string
//   ): Promise<InventoryItem> {
//     const { item, idx } = getItemOrThrow(itemId);

//     if (item.status !== "checked_out") {
//       throw new Error(
//         `Item ${item.tag_number} must be checked out before marking with customer`
//       );
//     }

//     inventoryItems[idx] = {
//       ...item,
//       status: item.disposition === "sold" ? "retired" : "with_customer",
//       customer_id: customerId,
//     };

//     return Promise.resolve(inventoryItems[idx]);
//   }


//   // inventory.service.ts — add
// static async releaseReservedItems(itemIds: string[], recordedBy: string): Promise<void> {
//   for (const itemId of itemIds) {
//     const { item, idx } = getItemOrThrow(itemId);
//     if (item.status !== "reserved") continue;

//     inventoryItems[idx] = {
//       ...item,
//       status: "available",
//       order_id: undefined,
//     };
//   }

//   if (itemIds.length > 0) {
//     recordMovement({
//       product_id: inventoryItems.find(i => itemIds.includes(i.id))?.product_id ?? "",
//       movement_type: "adjustment",
//       quantity: itemIds.length,
//       item_ids: itemIds,
//       reference_type: "manual",
//       location_id: "loc-1",
//       notes: "Released due to trip cancellation",
//       recorded_by: recordedBy,
//     });
//   }
// }
// }












import { inventoryApi } from "../api/inventory.api";
import {
  adaptInventoryItem,
  adaptConsumableStock,
  adaptStockMovement,
} from "../adapters/inventory.adapter";
import { getErrorMessage } from "@/lib/api/error";
import type {
  InventoryItem, InventoryItemStatus, ConsumableStock,
  StockMovement, WarehouseLocation,
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
      const raw = await inventoryApi.getItem(Number(id));
      return adaptInventoryItem(raw);
    } catch { return undefined; }
  }

  // static async getItemsByProduct(productId: string): Promise<InventoryItem[]> {
  //   return InventoryService.getItems({ product_id: productId });
  // }

  // static async getAvailableItems(productId: string): Promise<InventoryItem[]> {
  //   return InventoryService.getItems({ product_id: productId, status: "available" });
  // }

  // static async getAvailableCount(productId: string): Promise<number> {
  //   const items = await InventoryService.getAvailableItems(productId);
  //   return items.length;
  // }

  // static async getItemsByStatus(status: InventoryItemStatus): Promise<InventoryItem[]> {
  //   return InventoryService.getItems({ status });
  // }

  static async getConsumableStock(): Promise<ConsumableStock[]> {
    const raw = await inventoryApi.listStock();
    return raw.map(adaptConsumableStock);
  }

  static async getConsumableStockByProduct(productId: string): Promise<ConsumableStock | undefined> {
    const all = await InventoryService.getConsumableStock();
    return all.find(s => s.product_id === productId);
  }

  static async getConsumableStockLevel(productId: string): Promise<number> {
    const stock = await InventoryService.getConsumableStockByProduct(productId);
    return stock?.quantity ?? 0;
  }

  static async getMovements(params: { product_id?: string; item_id?: number } = {}): Promise<StockMovement[]> {
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
      const raw = await inventoryApi.returnItem(Number(input.item_id), {
        condition: input.condition,
        notes:     input.notes,
      });
      return adaptInventoryItem(raw);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to return item"));
    }
  }

  // These methods are kept for interface compatibility but are now handled
  // by the backend automatically — they are no-ops on the frontend
  static async reserveItems(_input: any): Promise<InventoryItem[]> {
    return [];
  }

  static async checkOutItems(_input: any): Promise<InventoryItem[]> {
    // Backend handles at trip dispatch
    return [];
  }

  static async decrementConsumableStock(_productId: string, _locationId: string,
    _quantity: number, _tripId: string, _recordedBy: string): Promise<ConsumableStock> {
    // Backend handles at trip dispatch
    return {} as ConsumableStock;
  }

  static async markWithCustomer(_itemId: string, _customerId: string): Promise<InventoryItem> {
    // Backend handles at delivery confirmation
    return {} as InventoryItem;
  }

  static async releaseReservedItems(_itemIds: string[], _recordedBy: string): Promise<void> {
    // Backend handles at trip cancellation
  }

  static async updateItemStatus(_id: string, _status: InventoryItemStatus): Promise<InventoryItem> {
    // Backend handles
    return {} as InventoryItem;
  }
}


