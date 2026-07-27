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
  home: () => "/orders",
  list: () => "/orders/list",

  new: () => "/orders/new",
  detail: (orderNo: string) => `/orders/${orderNo}`,
  edit: (orderNo: string) => `/orders/${orderNo}/edit`,

//   confirm: (orderNo: string) => `/orders/${orderNo}/confirm`,
//   approval: (orderNo: string) => `/orders/${orderNo}/approval`,
//   close: (orderNo: string) => `/orders/${orderNo}/close`,

//   delivery: (orderNo: string) => `/orders/${orderNo}/delivery`,
  deliveryConfirm: (orderNo: string) =>
    `/orders/${orderNo}/delivery/confirm`,
} as const;