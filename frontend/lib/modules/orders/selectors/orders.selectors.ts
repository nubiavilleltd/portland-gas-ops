

import type {
  Order,
  OrderStatus,
  FulfillmentStatus,
  PaymentStatus,
  OrderKPIs,
} from "@/lib/modules/orders/types/orders.types";

import type { Product } from "../../products/types/product.types";
import type { CreateOrderFormValues } from "../schemas/create-order.schema";

// ── LOOKUPS ─────────────────────────────────────────────

export function getOrderById(
  orders: Order[],
  id: string
): Order | undefined {
  return orders.find((o) => o.id === id);
}

// ── FILTERS ─────────────────────────────────────────────

export function getOrdersByStatus(
  orders: Order[],
  status: OrderStatus
): Order[] {
  return orders.filter((o) => o.order_status === status);
}

export function getOrdersByFulfillmentStatus(
  orders: Order[],
  status: FulfillmentStatus
): Order[] {
  return orders.filter((o) => o.fulfillment_status === status);
}

export function getOrdersByPaymentStatus(
  orders: Order[],
  status: PaymentStatus
): Order[] {
  return orders.filter((o) => o.payment_status === status);
}

export function getConfirmedUnassignedOrders(orders: Order[]): Order[] {
  return orders.filter(
    (o) =>
      o.order_status === "confirmed" &&
      o.fulfillment_status === "pending"
  );
}

// ── KPIs (pure aggregation) ─────────────────────────────

export function getOrderKPIs(orders: Order[]): OrderKPIs {
  return {
    totalOrders: orders.length,
    pendingDispatch: orders.filter(
      (o) =>
        o.order_status === "confirmed" &&
        o.fulfillment_status === "pending"
    ).length,
    inTransit: orders.filter(
      (o) =>
        o.fulfillment_status === "dispatched" ||
        o.fulfillment_status === "in_transit"
    ).length,
    delivered: orders.filter((o) => o.fulfillment_status === "delivered")
      .length,
    unpaidOrders: orders.filter(
      (o) =>
        o.payment_status === "unpaid" ||
        o.payment_status === "partially_paid"
    ).length,
    totalRevenue: orders.reduce((sum, o) => sum + o.total_amount, 0),
  };
}


