"use client";

import { useQuery } from "@tanstack/react-query";

import { parseError } from "@/lib/errors";

import { ProductsService } from "@/lib/modules/products/services/products.service";

import { PRODUCT_KEYS } from "../constants/query-keys";
import type {
  InventoryTracking,
  ProductStatus,
} from "../types/product.types";

// ── Products ──────────────────────────────────────────────

export function useProducts(filters?: {
  search?: string;
  status?: ProductStatus;
  inventoryTracking?: InventoryTracking;
  categoryId?: string;
}) {
  const query = useQuery({
    queryKey: PRODUCT_KEYS.list(filters),
    queryFn: () => ProductsService.getProducts(filters),
    staleTime: 60 * 1000,
  });

  return {
    products: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? parseError(query.error) : null,
    refetch: query.refetch,
  };
}

export function useProductById(productId: string) {
  const query = useQuery({
    queryKey: PRODUCT_KEYS.detail(productId),
    queryFn: () => ProductsService.getProduct(productId),
    enabled: !!productId,
    staleTime: 60 * 1000,
  });

  return {
    product: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? parseError(query.error) : null,
    refetch: query.refetch,
  };
}

export function useActiveProducts() {
  const { products, ...query } = useProducts();

  return {
    products: products.filter((product) => product.status === "active"),
    ...query,
  };
}

export function useProductSelectOptions() {
  const { products, ...query } = useProducts();

  return {
    options: products.map((product) => ({
      value: product.id,
      label: `${product.productNo} • ${product.name}`,
    })),
    ...query,
  };
}

// ── Picker ────────────────────────────────────────────────

export function useProductPicker() {
  const query = useQuery({
    queryKey: PRODUCT_KEYS.picker(),
    queryFn: () => ProductsService.getProductsForPicker(),
    staleTime: 60 * 1000,
  });

  return {
    products: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? parseError(query.error) : null,
    refetch: query.refetch,
  };
}

// ── Reference tables ──────────────────────────────────────

export function useCategories() {
  const query = useQuery({
    queryKey: PRODUCT_KEYS.categories(),
    queryFn: () => ProductsService.getCategories(),
    staleTime: 5 * 60 * 1000,
  });

  return {
    categories: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? parseError(query.error) : null,
    refetch: query.refetch,
  };
}

export function useUnits() {
  const query = useQuery({
    queryKey: PRODUCT_KEYS.units(),
    queryFn: () => ProductsService.getUnits(),
    staleTime: 5 * 60 * 1000,
  });

  return {
    units: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? parseError(query.error) : null,
    refetch: query.refetch,
  };
}