"use client";

// ============================================================
//  PRODUCTS HOOKS
//

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { ProductsService } from "@/lib/modules/products/services/products.service";
import type { Product } from "@/lib/modules/products/types/product.types";
import {
    getProductByNo,
    getActiveProducts,
    getProductSelectOptions,
} from "@/lib/modules/products/selectors/products.selectors";
import { parseError } from "@/lib/errors";
import { PRODUCT_KEYS } from "../constants/query-keys";


export function useProducts() {
  const query = useQuery({
    queryKey: PRODUCT_KEYS.lists(),
    queryFn: ProductsService.getProducts,
    staleTime: 60 * 1000,
  });

  return {
    products: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? parseError(query.error) : null,
    refetch: query.refetch,
  };
}



export function useProductByNo(productNo: string) {
    const { products, isLoading, error, refetch } = useProducts();
    return { product:getProductByNo(products, productNo), isLoading, error, refetch };
}

// ── Derived: active products only ────────────────────────
export function useActiveProducts() {
    const { products, isLoading, error, refetch } = useProducts();
    const active = getActiveProducts(products);   // selector
    return { products: active, isLoading, error, refetch };
}


export function useProductSelectOptions() {
    const { products, isLoading, error, refetch } = useProducts();
    const options = getProductSelectOptions(products);   // selector
    return { options, isLoading, error, refetch };
}