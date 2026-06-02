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

import { useState, useEffect, useCallback } from "react";
import { ProductsService } from "@/lib/modules/products/services/products.service";
import type { Product } from "@/lib/modules/products/types/product.types";
import {
    getProductById,
    getActiveProducts,
    getProductSelectOptions,
} from "@/lib/modules/products/selectors/products.selectors";
import { parseError } from "@/lib/errors";

// ── Shared result shape ────────────────────────────────────
interface UseProductsResult {
    products: Product[];
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

// ── Base hook ─────────────────────────────────────────────
export function useProducts(): UseProductsResult {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await ProductsService.getProducts();
            console.log("data", {data})
            setProducts(data);
        } catch (err) {
            setError(parseError(err));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    return { products, isLoading, error, refetch: fetch };
}

// ── Derived: single product ───────────────────────────────
interface UseProductByIdResult {
    product: Product | undefined;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useProductById(id: string): UseProductByIdResult {
    const { products, isLoading, error, refetch } = useProducts();

    console.log("product in ", { products })
    const product = getProductById(products, id);   // selector
    return { product, isLoading, error, refetch };
}

// ── Derived: active products only ────────────────────────
export function useActiveProducts(): UseProductsResult {
    const { products, isLoading, error, refetch } = useProducts();
    const active = getActiveProducts(products);   // selector
    return { products: active, isLoading, error, refetch };
}

// ── Derived: formatted options for dropdowns ─────────────
interface UseProductOptionsResult {
    options: Array<{ value: string; label: string }>;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useProductSelectOptions(): UseProductOptionsResult {
    const { products, isLoading, error, refetch } = useProducts();
    const options = getProductSelectOptions(products);   // selector
    return { options, isLoading, error, refetch };
}