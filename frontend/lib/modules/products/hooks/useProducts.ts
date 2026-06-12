"use client";

// ============================================================
//  PRODUCTS HOOKS
//
//  useProducts()         — fetches all products via service
//  useProductById(id)    — finds one product by id
//  useActiveProducts()   — only status === "active"
//
//  TODAY:   useEffect + service call (mock data)
//  FUTURE:  swap useEffect body for useQuery — components unchanged
//
//  FUTURE SWAP (useProducts):
//    return useQuery({
//      queryKey: PRODUCT_KEYS.products,
//      queryFn:  () => ProductsService.getProducts(),
//    });
// ============================================================

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { ProductsService } from "@/lib/modules/products/services/products.service";
import type { Product } from "@/lib/modules/products/types/product.types";
import {
    getProductById,
    getActiveProducts,
    getProductSelectOptions,
} from "@/lib/modules/products/selectors/products.selectors";
import { parseError } from "@/lib/errors";
import { PRODUCT_KEYS } from "../constants/query-keys";

// ── Shared result shape ────────────────────────────────────
interface UseProductsResult {
    products: Product[];
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

// ── Base hook ─────────────────────────────────────────────
// export function useProducts(): UseProductsResult {
//     const [products, setProducts] = useState<Product[]>([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);

//     const fetch = useCallback(async () => {
//         setIsLoading(true);
//         setError(null);
//         try {
//             const data = await ProductsService.getProducts();
//             console.log("data", {data})
//             setProducts(data);
//         } catch (err) {
//             setError(parseError(err));
//         } finally {
//             setIsLoading(false);
//         }
//     }, []);

//     useEffect(() => { fetch(); }, [fetch]);

//     return { products, isLoading, error, refetch: fetch };
// }

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


// ── Derived: single product ───────────────────────────────
// interface UseProductByIdResult {
//     product: Product | undefined;
//     isLoading: boolean;
//     error: string | null;
//     refetch: () => void;
// }

export function useProductById(id: string) {
    const { products, isLoading, error, refetch } = useProducts();
    return { product:getProductById(products, id), isLoading, error, refetch };
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