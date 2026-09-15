"use client";

import { useQuery } from "@tanstack/react-query";

import { InventoryService } from "../services/inventory.service";
import { parseError } from "@/lib/errors";
import { INVENTORY_KEYS } from "../constants/inventory-query-keys";

import {
  getDefaultLocation,
  getLocationById,
  getItemById,
  getItemByTag,
  getItemsByProduct,
  getItemsByStatus,
  getAvailableItems,
  getAvailableCount,
  getItemsByCustomer,
  getItemsByOrder,
  getConsumableStockByProduct,
  getConsumableStockLevel,
  getMovementsByProduct,
  getMovementsByItem,
} from "../selectors/inventory.selectors";

import type { InventoryItemStatus } from "../types/inventory.types";

// ── LOCATIONS ────────────────────────────────────────────

export function useLocations() {
  const query = useQuery({
    queryKey: INVENTORY_KEYS.locations(),
    queryFn: InventoryService.getLocations,
    staleTime: 60 * 1000,
  });

  return {
    locations: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? parseError(query.error) : null,
    refetch: query.refetch,
  };
}

export function useDefaultLocation() {
  const { locations, isLoading, error } = useLocations();

  return {
    location: getDefaultLocation(locations),
    isLoading,
    error,
  };
}

export function useLocationById(id: string) {
  const { locations, isLoading, error } = useLocations();

  return {
    location: getLocationById(locations, id),
    isLoading,
    error,
  };
}

// ── OVERVIEW ─────────────────────────────────────────────

export function useInventoryOverview(filters?: {
  search?: string;
  inventoryTracking?: "INDIVIDUAL_ITEMS" | "STOCK_QUANTITY";
  categoryId?: string;
  stockStatus?: "ok" | "low" | "out";
  page?: number;
  pageSize?: number;
}) {
  const query = useQuery({
    queryKey: INVENTORY_KEYS.overview(filters),
    queryFn: () => InventoryService.getOverview(filters),
    staleTime: 60 * 1000,
  });

  return {
    items: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? 1,
    pageSize: query.data?.pageSize ?? 50,
    hasNext: query.data?.hasNext ?? false,
    isLoading: query.isLoading,
    error: query.error ? parseError(query.error) : null,
    refetch: query.refetch,
  };
}

export function useProductAvailability(productId: string) {
  const query = useQuery({
    queryKey: INVENTORY_KEYS.productAvailability(productId),
    queryFn: () => InventoryService.getProductAvailability(productId),
    enabled: !!productId,
    staleTime: 60 * 1000,
  });

  return {
    availability: query.data,
    isLoading: query.isLoading,
    error: query.error ? parseError(query.error) : null,
    refetch: query.refetch,
  };
}

// ── INDIVIDUAL ITEMS ─────────────────────────────────────

export function useInventoryItems() {
  const query = useQuery({
    queryKey: INVENTORY_KEYS.items(),
    queryFn: InventoryService.getItems,
    staleTime: 60 * 1000,
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? parseError(query.error) : null,
    refetch: query.refetch,
  };
}

export function useInventoryItemById(id: string) {
  const { items, isLoading, error, refetch } = useInventoryItems();

  return {
    item: getItemById(items, id),
    isLoading,
    error,
    refetch,
  };
}

export function useInventoryItemByTag(tagNumber: string) {
  const { items, isLoading, error } = useInventoryItems();

  return {
    item: getItemByTag(items, tagNumber),
    isLoading,
    error,
  };
}

export function useInventoryItemsByProduct(productId: string) {
  const { items, isLoading, error, refetch } = useInventoryItems();

  return {
    items: getItemsByProduct(items, productId),
    isLoading,
    error,
    refetch,
  };
}

export function useInventoryItemsByStatus(
  status: Parameters<typeof getItemsByStatus>[1],
) {
  const { items, isLoading, error } = useInventoryItems();

  return {
    items: getItemsByStatus(items, status),
    isLoading,
    error,
  };
}

export function useAvailableItems(productId: string) {
  const { items, isLoading, error } = useInventoryItems();

  return {
    items: getAvailableItems(items, productId),
    availableCount: getAvailableCount(items, productId),
    isLoading,
    error,
  };
}

export function useInventoryItemsByCustomer(customerId: string) {
  const { items, isLoading, error } = useInventoryItems();

  return {
    items: getItemsByCustomer(items, customerId),
    isLoading,
    error,
  };
}

export function useInventoryItemsByOrder(orderId: string) {
  const { items, isLoading, error } = useInventoryItems();

  return {
    items: getItemsByOrder(items, orderId),
    isLoading,
    error,
  };
}

// ── STOCK QUANTITY ───────────────────────────────────────

export function useConsumableStock() {
  const query = useQuery({
    queryKey: INVENTORY_KEYS.consumableStock(),
    queryFn: InventoryService.getConsumableStock,
    staleTime: 60 * 1000,
  });

  return {
    stock: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? parseError(query.error) : null,
    refetch: query.refetch,
  };
}

export function useConsumableStockDetail(id: string) {
  const query = useQuery({
    queryKey: INVENTORY_KEYS.consumableStockDetail(id),
    queryFn: () => InventoryService.getConsumableStockById(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  });

  return {
    stock: query.data,
    isLoading: query.isLoading,
    error: query.error ? parseError(query.error) : null,
    refetch: query.refetch,
  };
}

export function useConsumableStockByProduct(productId: string) {
  const { stock, isLoading, error, refetch } = useConsumableStock();

  return {
    stock: getConsumableStockByProduct(stock, productId),
    quantity: getConsumableStockLevel(stock, productId),
    isLoading,
    error,
    refetch,
  };
}

export function useConsumableLocations(productId: string) {
  const query = useQuery({
    queryKey: INVENTORY_KEYS.consumableLocations(productId),
    queryFn: () => InventoryService.getConsumableLocations(productId),
    enabled: !!productId,
    staleTime: 60 * 1000,
  });

  return {
    locations: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? parseError(query.error) : null,
    refetch: query.refetch,
  };
}

// ── STOCK MOVEMENTS ──────────────────────────────────────

export function useStockMovements() {
  const query = useQuery({
    queryKey: INVENTORY_KEYS.movements(),
    queryFn: () => InventoryService.getMovements(),
    staleTime: 60 * 1000,
  });

  return {
    movements: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? parseError(query.error) : null,
    refetch: query.refetch,
  };
}

export function useStockMovementsByProduct(productId: string) {
  const { movements, isLoading, error } = useStockMovements();

  return {
    movements: getMovementsByProduct(movements, productId),
    isLoading,
    error,
  };
}

export function useStockMovementsByItem(itemId: string) {
  const { movements, isLoading, error } = useStockMovements();

  return {
    movements: getMovementsByItem(movements, itemId),
    isLoading,
    error,
  };
}