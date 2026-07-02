// "use client";

// import { useQuery } from "@tanstack/react-query";
// import { InventoryService } from "../services/inventory.service";
// import { parseError } from "@/lib/errors";
// import { INVENTORY_KEYS } from "../constants/inventory-query-keys";
// import type { InventoryKPIs } from "../selectors/inventory.selectors";

// import {
//   getItemById,
//   getItemByTag,
//   getItemsByProduct,
//   getItemsByStatus,
//   getAvailableItems,
//   getAvailableCount,
//   getItemsByCustomer,
//   getItemsByOrder,
//   getConsumableStockByProduct,
//   getConsumableStockLevel,
//   getMovementsByProduct,
//   getMovementsByItem,
//   getDefaultLocation,
//   getLocationById,
//   getInventoryKPIs,
// } from "../selectors/inventory.selectors";

// // ── LOCATIONS ────────────────────────────────────────────

// export function useLocations() {
//   const query = useQuery({
//     queryKey: INVENTORY_KEYS.locations(),
//     queryFn: InventoryService.getLocations,
//     staleTime: 60 * 1000,
//   });

//   return {
//     locations: query.data ?? [],
//     isLoading: query.isLoading,
//     error: query.error ? parseError(query.error) : null,
//     refetch: query.refetch,
//   };
// }

// export function useDefaultLocation() {
//   const { locations, isLoading, error } = useLocations();

//   return {
//     location: getDefaultLocation(locations),
//     isLoading,
//     error,
//   };
// }

// export function useLocationById(id: string) {
//   const { locations, isLoading, error } = useLocations();

//   return {
//     location: getLocationById(locations, id),
//     isLoading,
//     error,
//   };
// }

// // ── TRACKED ITEMS ────────────────────────────────────────

// export function useInventoryItems() {
//   const query = useQuery({
//     queryKey: INVENTORY_KEYS.items(),
//     queryFn: InventoryService.getItems,
//     staleTime: 60 * 1000,
//   });

//   return {
//     items: query.data ?? [],
//     isLoading: query.isLoading,
//     error: query.error ? parseError(query.error) : null,
//     refetch: query.refetch,
//   };
// }

// export function useInventoryItemById(id: string) {
//   const { items, isLoading, error, refetch } = useInventoryItems();

//   return {
//     item: getItemById(items, id),
//     isLoading,
//     error,
//     refetch,
//   };
// }

// export function useInventoryItemByTag(tagNumber: string) {
//   const { items, isLoading, error } = useInventoryItems();

//   return {
//     item: getItemByTag(items, tagNumber),
//     isLoading,
//     error,
//   };
// }

// export function useInventoryItemsByProduct(productId: string) {
//   const { items, isLoading, error, refetch } = useInventoryItems();

//   return {
//     items: getItemsByProduct(items, productId),
//     isLoading,
//     error,
//     refetch,
//   };
// }

// export function useInventoryItemsByStatus(
//   status: Parameters<typeof getItemsByStatus>[1],
// ) {
//   const { items, isLoading, error } = useInventoryItems();

//   return {
//     items: getItemsByStatus(items, status),
//     isLoading,
//     error,
//   };
// }

// export function useAvailableItems(productId: string) {
//   const { items, isLoading, error } = useInventoryItems();

//   return {
//     items: getAvailableItems(items, productId),
//     availableCount: getAvailableCount(items, productId),
//     isLoading,
//     error,
//   };
// }

// export function useInventoryItemsByCustomer(customerId: string) {
//   const { items, isLoading, error } = useInventoryItems();

//   return {
//     items: getItemsByCustomer(items, customerId),
//     isLoading,
//     error,
//   };
// }

// export function useInventoryItemsByOrder(orderId: string) {
//   const { items, isLoading, error } = useInventoryItems();

//   return {
//     items: getItemsByOrder(items, orderId),
//     isLoading,
//     error,
//   };
// }

// // ── CONSUMABLE STOCK ─────────────────────────────────────

// export function useConsumableStock() {
//   const query = useQuery({
//     queryKey: INVENTORY_KEYS.consumableStock(),
//     queryFn: InventoryService.getConsumableStock,
//     staleTime: 60 * 1000,
//   });

//   return {
//     stock: query.data ?? [],
//     isLoading: query.isLoading,
//     error: query.error ? parseError(query.error) : null,
//     refetch: query.refetch,
//   };
// }

// export function useConsumableStockByProduct(productId: string) {
//   const { stock, isLoading, error, refetch } = useConsumableStock();

//   return {
//     stock: getConsumableStockByProduct(stock, productId),
//     quantity: getConsumableStockLevel(stock, productId),
//     isLoading,
//     error,
//     refetch,
//   };
// }

// // ── STOCK MOVEMENTS ──────────────────────────────────────

// export function useStockMovements() {
//   const query = useQuery({
//     queryKey: INVENTORY_KEYS.movements(),
//     queryFn: InventoryService.getMovements,
//     staleTime: 60 * 1000,
//   });

//   return {
//     movements: query.data ?? [],
//     isLoading: query.isLoading,
//     error: query.error ? parseError(query.error) : null,
//     refetch: query.refetch,
//   };
// }

// export function useStockMovementsByProduct(productId: string) {
//   const { movements, isLoading, error } = useStockMovements();

//   return {
//     movements: getMovementsByProduct(movements, productId),
//     isLoading,
//     error,
//   };
// }

// export function useStockMovementsByItem(itemId: string) {
//   const { movements, isLoading, error } = useStockMovements();

//   return {
//     movements: getMovementsByItem(movements, itemId),
//     isLoading,
//     error,
//   };
// }

// // ── KPIs ─────────────────────────────────────────────────

// const EMPTY_KPIS: InventoryKPIs = {
//   totalTrackedItems: 0,
//   availableItems: 0,
//   reservedItems: 0,
//   checkedOutItems: 0,
//   withCustomerItems: 0,
//   maintenanceItems: 0,
//   retiredItems: 0,
// };

// export function useInventoryKPIs() {
//   const { items, isLoading, error, refetch } = useInventoryItems();

//   const kpis = isLoading ? EMPTY_KPIS : getInventoryKPIs(items);

//   return {
//     kpis,
//     isLoading,
//     error,
//     refetch,
//   };
// }






"use client";
import { useQuery } from "@tanstack/react-query";
import { inventoryApi } from "../api/inventory.api";
import {
  adaptInventoryItem, adaptConsumableStock, adaptStockMovement,
} from "../adapters/inventory.adapter";
import { parseError } from "@/lib/errors";
import type { InventoryItem, ConsumableStock, StockMovement } from "../types/inventory.types";

const INVENTORY_KEYS = {
  items:     ["inventory", "items"],
  stock:     ["inventory", "stock"],
  movements: ["inventory", "movements"],
  locations: ["inventory", "locations"],
  kpis:      ["inventory", "kpis"],
  item:      (id: number) => ["inventory", "items", id],
  itemMovements: (id: number) => ["inventory", "movements", "item", id],
};

export function useInventoryItems(params: { product_id?: string; status?: string } = {}) {
  const query = useQuery({
    queryKey: [...INVENTORY_KEYS.items, params],
    queryFn:  () => inventoryApi.listItems(params).then(r => r.map(adaptInventoryItem)),
    staleTime: 30_000,
  });
  return {
    items:     query.data ?? [],
    isLoading: query.isLoading,
    error:     query.error ? parseError(query.error) : null,
    refetch:   query.refetch,
  };
}

export function useInventoryItemById(id: string | number) {
  const numId = Number(id);
  const query = useQuery({
    queryKey: INVENTORY_KEYS.item(numId),
    queryFn:  () => inventoryApi.getItem(numId).then(adaptInventoryItem),
    enabled:  !!id,
    staleTime: 30_000,
  });
  return {
    item:      query.data,
    isLoading: query.isLoading,
    error:     query.error ? parseError(query.error) : null,
  };
}

export function useConsumableStock() {
  const query = useQuery({
    queryKey: INVENTORY_KEYS.stock,
    queryFn:  () => inventoryApi.listStock().then((r: any[]) => r.map(adaptConsumableStock)),
    staleTime: 30_000,
  });
  return {
    stock:     query.data ?? [],
    isLoading: query.isLoading,
  };
}

export function useStockMovements(params: { product_id?: string } = {}) {
  const query = useQuery({
    queryKey: [...INVENTORY_KEYS.movements, params],
    queryFn:  () => inventoryApi.listMovements(params).then((r: any[]) => r.map(adaptStockMovement)),
    staleTime: 30_000,
  });
  return {
    movements: query.data ?? [],
    isLoading: query.isLoading,
  };
}

export function useStockMovementsByItem(itemId: string | number) {
  const numId = Number(itemId);
  const query = useQuery({
    queryKey: INVENTORY_KEYS.itemMovements(numId),
    queryFn:  () => inventoryApi.listMovements({ item_id: numId }).then((r: any[]) => r.map(adaptStockMovement)),
    enabled:  !!itemId,
    staleTime: 30_000,
  });
  return {
    movements: query.data ?? [],
    isLoading: query.isLoading,
  };
}

export function useLocations() {
  const query = useQuery({
    queryKey: INVENTORY_KEYS.locations,
    queryFn:  inventoryApi.getLocations,
    staleTime: 5 * 60_000,  // locations rarely change
  });
  return {
    locations: query.data ?? [],
    isLoading: query.isLoading,
  };
}

export function useInventoryKPIs() {
  const query = useQuery({
    queryKey: INVENTORY_KEYS.kpis,
    queryFn:  inventoryApi.getKpis,
    staleTime: 30_000,
  });
  return {
    kpis:      query.data ?? {
      totalTrackedItems: 0, availableItems: 0, reservedItems: 0,
      checkedOutItems: 0, withCustomerItems: 0, maintenanceItems: 0,
    },
    isLoading: query.isLoading,
  };
}
