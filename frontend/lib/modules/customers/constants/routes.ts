// ─────────────────────────────────────────────────────────
//  CUSTOMER ROUTES
//
//  Usage (inside customers module):
//    import { CUSTOMER_ROUTES } from "../constants/routes";
//
//  Usage (from outside / cross-domain):
//    import { CUSTOMER_ROUTES } from "@/lib/routes";
// ─────────────────────────────────────────────────────────

export const CUSTOMER_ROUTES = {
    list: () => "/customers",
    new: () => "/customers/new",
    detail: (id: string) => `/customers/${id}`,
    edit: (id: string) => `/customers/${id}/edit`,
} as const;