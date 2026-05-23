// ─────────────────────────────────────────────────────────
//  ORDER ROUTES
//  Single source of truth for every URL in the orders domain.
//
//  Usage (inside orders module):
//    import { ORDER_ROUTES } from "../constants/routes";
//
//  Usage (from outside / cross-domain):
//    import { ORDER_ROUTES } from "@/lib/routes";
// ─────────────────────────────────────────────────────────

export const ORDER_ROUTES = {
    // Lists
    list: () => "/orders",

    // Create / Edit
    new: () => "/orders/new",
    edit: (id: string) => `/orders/${id}/edit`,

    // Detail
    detail: (id: string) => `/orders/${id}`,

    // Actions — these use the route-based modal pattern:
    // direct URL visit → always-open modal (keeps deep-link)
    // opened from detail page → controlled modal
    confirm: (id: string) => `/orders/${id}/confirm`,
    close: (id: string) => `/orders/${id}/close`,
    approval: (id: string) => `/orders/${id}/approval`,

    // Delivery sub-routes
    delivery: (id: string) => `/orders/${id}/delivery`,
    deliveryConfirm: (id: string) => `/orders/${id}/delivery/confirm`,
} as const;