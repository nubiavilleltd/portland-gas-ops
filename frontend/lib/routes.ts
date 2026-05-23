// ─────────────────────────────────────────────────────────
//  ROUTES BARREL
//  Re-exports every domain's route constants from one place.
//
//  Use this when you need routes from more than one domain,
//  or when you are outside a domain module entirely (e.g. a
//  shared component, a layout, or a cross-domain page).
//
//  Usage:
//    import { ORDER_ROUTES, FLEET_ROUTES } from "@/lib/routes";
//
//  Rule of thumb:
//    Inside lib/modules/orders/... → import { ORDER_ROUTES } from "../constants/routes"
//    Anywhere else                 → import { ORDER_ROUTES } from "@/lib/routes"
// ─────────────────────────────────────────────────────────

export { ORDER_ROUTES }    from "@/lib/modules/orders/constants/routes";
export { FLEET_ROUTES }    from "@/lib/modules/fleet/constants/routes";
export { PRODUCT_ROUTES }  from "@/lib/modules/products/constants/routes";
export { CUSTOMER_ROUTES } from "@/lib/modules/customers/constants/routes";
export { INVOICE_ROUTES }  from "@/lib/modules/invoices/constants/routes";
export { PAYMENT_ROUTES }  from "@/lib/modules/payments/constants/routes";