// ─────────────────────────────────────────────────────────
//  PAYMENT ROUTES
//
//  Usage (inside payments module):
//    import { PAYMENT_ROUTES } from "../constants/routes";
//
//  Usage (from outside / cross-domain):
//    import { PAYMENT_ROUTES } from "@/lib/routes";
// ─────────────────────────────────────────────────────────

export const PAYMENT_ROUTES = {
  list:    ()           => "/payments",
  new:     ()           => "/payments/new",
  detail:  (id: string) => `/payments/${id}`,
  receipt: (id: string) => `/payments/${id}/receipt`,
} as const;