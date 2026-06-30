"use client";

// ============================================================
//  PRODUCTS HOOKS
//

import { useQuery } from "@tanstack/react-query";
import { ProductsService } from "@/lib/modules/products/services/products.service";
import {
  getProductByNo,
  getActiveProducts,
  getProductSelectOptions,
  getProductById,
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
  return {
    product: getProductByNo(products, productNo),
    isLoading,
    error,
    refetch,
  };
}

export function useProductById(id: string) {
  const { products, isLoading, error, refetch } = useProducts();

  return {
    product: getProductById(products, id),
    isLoading,
    error,
    refetch,
  };
}

// ── Derived: active products only ────────────────────────
export function useActiveProducts() {
  const { products, isLoading, error, refetch } = useProducts();
  return { products: getActiveProducts(products), isLoading, error, refetch };
}

export function useProductSelectOptions() {
  const { products, isLoading, error, refetch } = useProducts();
  return { options: getProductSelectOptions(products), isLoading, error, refetch };
}
