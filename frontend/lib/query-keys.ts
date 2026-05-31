// ─────────────────────────────────────────────────────────
//  QUERY KEYS BARREL
//  Re-exports every domain's query key constants from one place.
//
//  Use this when you need keys from more than one domain,
//  or when you are outside a domain module entirely (e.g. a
//  service that invalidates across domains after a mutation).
//
//  Usage:
//    import { FLEET_KEYS, ORDER_KEYS } from "@/lib/query-keys";
//
//  Rule of thumb:
//    Inside lib/modules/fleet/... → import { FLEET_KEYS } from "../constants/query-keys"
//    Anywhere else                → import { FLEET_KEYS } from "@/lib/query-keys"
//
//  Cross-domain invalidation example (assign trip touches drivers + trips):
//    import { FLEET_KEYS } from "@/lib/query-keys";
//    await queryClient.invalidateQueries({ queryKey: FLEET_KEYS.trips });
//    await queryClient.invalidateQueries({ queryKey: FLEET_KEYS.drivers });
//
//  Cross-domain invalidation example (record payment touches payments + invoices):
//    import { PAYMENT_KEYS, INVOICE_KEYS } from "@/lib/query-keys";
//    await queryClient.invalidateQueries({ queryKey: PAYMENT_KEYS.payments });
//    await queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.invoices });
// ─────────────────────────────────────────────────────────

export { ORDER_KEYS }    from "@/lib/modules/orders/constants/query-keys";
export { FLEET_KEYS }    from "@/lib/modules/fleet/constants/query-keys";
export { PRODUCT_KEYS }  from "@/lib/modules/products/constants/query-keys";
export { CUSTOMER_KEYS } from "@/lib/modules/customers/constants/query-keys";
export { INVOICE_KEYS }  from "@/lib/modules/invoices/constants/query-keys";
export { PAYMENT_KEYS }  from "@/lib/modules/payments/constants/query-keys";