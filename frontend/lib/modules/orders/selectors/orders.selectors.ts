// ============================================================
//  ORDERS SELECTORS
//  Pure transformation / business-logic functions.
//  No data fetching here — data comes from the service layer.
// ============================================================

// import { orders } from "@/lib/mock/orders";
import { dispatches } from "@/lib/mock/dispatches";
// import { invoices } from "@/lib/mock/invoices";
import { payments } from "@/lib/mock/payments";

import type {
  Order,
  OrderStatus,
  FulfillmentStatus,
  PaymentStatus,
  OrderKPIs,
} from "@/lib/modules/orders/types/orders.types";
import { orders } from "../mock/orders.mock";
import { invoices } from "../../invoices/mock/invoices.mock";

// ── DATA ACCESS (will be replaced by service calls in components) ────────

export function getOrders(): Order[] {
  return orders;
}

export function getOrderById(id: string): Order | undefined {
  return orders.find((o) => o.id === id);
}

// ── KPIs ─────────────────────────────────────────────────────────────────

export function getOrderKPIs(orderList: Order[]): OrderKPIs {
  return {
    totalOrders: orderList.length,
    pendingDispatch: orderList.filter(
      (o) =>
        o.order_status === "confirmed" && o.fulfillment_status === "pending",
    ).length,
    inTransit: orderList.filter(
      (o) =>
        o.fulfillment_status === "dispatched" ||
        o.fulfillment_status === "in_transit",
    ).length,
    delivered: orderList.filter((o) => o.fulfillment_status === "delivered")
      .length,
    unpaidOrders: orderList.filter(
      (o) =>
        o.payment_status === "unpaid" || o.payment_status === "partially_paid",
    ).length,
    totalRevenue: orderList.reduce((sum, o) => sum + o.total_amount, 0),
  };
}

// ── FILTERS ──────────────────────────────────────────────────────────────

export function getOrdersByStatus(
  orderList: Order[],
  status: OrderStatus,
): Order[] {
  return orderList.filter((o) => o.order_status === status);
}

export function getOrdersByFulfillmentStatus(
  orderList: Order[],
  status: FulfillmentStatus,
): Order[] {
  return orderList.filter((o) => o.fulfillment_status === status);
}

// ── BUSINESS RULES ───────────────────────────────────────────────────────

/** Order can only be confirmed from draft */
export function canConfirmOrder(order: Order): boolean {
  return order.order_status === "draft";
}

/** Order can only be dispatched if confirmed and pending fulfillment */
export function canAssignToTrip(order: Order): boolean {
  return (
    order.order_status === "confirmed" && order.fulfillment_status === "pending"
  );
}

/** Order is ready for invoice generation */
export function isOrderReadyForInvoice(order: Order): boolean {
  return order.fulfillment_status === "delivered" && !order.invoice_id;
}

/** Order can be closed (all done) */
export function isOrderComplete(order: Order): boolean {
  return (
    order.fulfillment_status === "delivered" && order.payment_status === "paid"
  );
}

/** Dispatch readiness — future: will also check requires_approval */
export function isOrderReadyForDispatch(order: Order): boolean {
  if (order.order_status !== "confirmed") return false;
  if (order.requires_approval && order.approval_status !== "approved")
    return false;
  return true;
}

// ── RELATED DATA LOOKUPS ─────────────────────────────────────────────────
// These will be replaced by service calls once backend is live.

export function getOrderDispatch(orderId: string) {
  return dispatches.find((d) => d.order_id === orderId);
}

export function getOrderInvoice(orderId: string) {
  return invoices.find((inv) => inv.order_id === orderId);
}

export function getOrderPayments(invoiceId?: string) {
  if (!invoiceId) return [];
  return payments.filter((p) => p.invoice_id === invoiceId);
}

export function getPaymentSummary(invoiceId?: string) {
  const relatedPayments = getOrderPayments(invoiceId);
  const amountPaid = relatedPayments.reduce((sum, p) => sum + p.amount, 0);
  return { amountPaid, count: relatedPayments.length };
}
