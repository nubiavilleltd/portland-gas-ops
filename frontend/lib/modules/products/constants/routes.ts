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
    list: () => "/admin/products",
    new: () => "/admin/products/new",
    detail: (id: string) => `/admin/products/${id}`,
    edit: (id: string) => `/admin/products/${id}/edit`,
} as const;