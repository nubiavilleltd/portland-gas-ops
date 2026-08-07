"use client";

import { useQuery } from "@tanstack/react-query";

import { parseError } from "@/lib/errors";

import { ProductsService } from "@/lib/modules/products/services/products.service";

import { PRODUCT_KEYS } from "../constants/query-keys";

export function useProducts() {
  const query = useQuery({
    queryKey: PRODUCT_KEYS.lists(),
    queryFn: () => ProductsService.getProducts(),
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
    products: products.filter(
      (product) => product.status === "active",
    ),
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