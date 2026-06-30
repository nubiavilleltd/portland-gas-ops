/**
 * Product Adapter
 *
 * Maps backend API responses to the frontend Product type.
 * Unlike customers (which had camelCase vs snake_case mismatch),
 * products already use snake_case on the frontend, so this adapter
 * mainly handles nullability differences, image shape mapping,
 * and numeric type coercion (Decimal from Python → number in JS).
 *
 * Still valuable because:
 * - Centralizes all backend→frontend shape knowledge in one place
 * - If backend ever changes field names, only this file changes
 * - Handles Decimal→number coercion (Python sends "850.00", JS needs 850)
 */

import type { Product, ProductImage, ProductType, ProductUnit, ProductStatus } from "../types/product.types";

// ── Backend response shape ─────────────────────────────────────────────────────
interface BackendProductImage {
    id: string | number;
    url: string;
    name: string;
}

interface BackendProduct {
    id: string;
    name: string;
    code: string | null;
    product_no: string;
    description: string | null;
    product_type: string;
    unit: string;
    default_unit_price: string | number;   // Python Decimal serializes as string
    minimum_stock: string | number | null;
    status: string;
    images: BackendProductImage[];
    created_at: string;
    updated_at: string;
}

interface BackendProductList {
    items: BackendProduct[];
    total: number;
    page: number;
    page_size: number;
    has_next: boolean;
}

// ── Mapping functions ──────────────────────────────────────────────────────────

function mapImage(raw: BackendProductImage): ProductImage {
    return {
        id: String(raw.id),
        url: raw.url,
        name: raw.name,
    };
}

export function adaptProduct(raw: BackendProduct): Product {
    return {
        // id: raw.id,
        id: raw.product_no,
        name: raw.name,
        code: raw.code ?? undefined,
        // product_no: raw.product_no ?? undefined,
        description: raw.description ?? undefined,
        product_type: raw.product_type as ProductType,
        unit: raw.unit as ProductUnit,
        default_unit_price: Number(raw.default_unit_price),
        minimum_stock: raw.minimum_stock != null ? Number(raw.minimum_stock) : undefined,
        status: raw.status as ProductStatus,
        images: (raw.images ?? []).map(mapImage),
        created_at: raw.created_at,
        updated_at: raw.updated_at,
    };
}

export function adaptProductList(raw: BackendProductList): Product[] {
    return raw.items.map(adaptProduct);
}