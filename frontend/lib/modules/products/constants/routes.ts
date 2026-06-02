// ─────────────────────────────────────────────────────────
//  PRODUCT ROUTES
//
//  Usage (inside products module):
//    import { PRODUCT_ROUTES } from "../constants/routes";
//
//  Usage (from outside / cross-domain):
//    import { PRODUCT_ROUTES } from "@/lib/routes";
// ─────────────────────────────────────────────────────────

export const PRODUCT_ROUTES = {
    list: () => "/products",
    new: () => "/products/new",
    detail: (id: string) => `/products/${id}`,
    edit: (id: string) => `/products/${id}/edit`,
} as const;