// // ============================================================
// //  ORDERS SELECTORS
// //  Pure transformation / business-logic functions.
// //  No data fetching here — data comes from the service layer.
// // ============================================================

// // import { orders } from "@/lib/mock/orders";
// import { dispatches } from "@/lib/mock/dispatches";
// // import { invoices } from "@/lib/mock/invoices";
// import { payments } from "@/lib/mock/payments";

// import type {
//   Order,
//   OrderStatus,
//   FulfillmentStatus,
//   PaymentStatus,
//   OrderKPIs,
// } from "@/lib/modules/orders/types/orders.types";
// import { orders } from "../mock/orders.mock";
// import { invoices } from "../../invoices/mock/invoices.mock";

// // ── DATA ACCESS (will be replaced by service calls in components) ────────

// export function getOrders(): Order[] {
//   return orders;
// }

// export function getOrderById(id: string): Order | undefined {
//   return orders.find((o) => o.id === id);
// }

// // ── KPIs ─────────────────────────────────────────────────────────────────

// export function getOrderKPIs(orderList: Order[]): OrderKPIs {
//   return {
//     totalOrders: orderList.length,
//     pendingDispatch: orderList.filter(
//       (o) =>
//         o.order_status === "confirmed" && o.fulfillment_status === "pending",
//     ).length,
//     inTransit: orderList.filter(
//       (o) =>
//         o.fulfillment_status === "dispatched" ||
//         o.fulfillment_status === "in_transit",
//     ).length,
//     delivered: orderList.filter((o) => o.fulfillment_status === "delivered")
//       .length,
//     unpaidOrders: orderList.filter(
//       (o) =>
//         o.payment_status === "unpaid" || o.payment_status === "partially_paid",
//     ).length,
//     totalRevenue: orderList.reduce((sum, o) => sum + o.total_amount, 0),
//   };
// }

// // ── FILTERS ──────────────────────────────────────────────────────────────

// export function getOrdersByStatus(
//   orderList: Order[],
//   status: OrderStatus,
// ): Order[] {
//   return orderList.filter((o) => o.order_status === status);
// }

// export function getOrdersByFulfillmentStatus(
//   orderList: Order[],
//   status: FulfillmentStatus,
// ): Order[] {
//   return orderList.filter((o) => o.fulfillment_status === status);
// }

// // ── BUSINESS RULES ───────────────────────────────────────────────────────

// /** Order can only be confirmed from draft */
// export function canConfirmOrder(order: Order): boolean {
//   return order.order_status === "draft";
// }

// /** Order can only be dispatched if confirmed and pending fulfillment */
// export function canAssignToTrip(order: Order): boolean {
//   return (
//     order.order_status === "confirmed" && order.fulfillment_status === "pending"
//   );
// }

// /** Order is ready for invoice generation */
// export function isOrderReadyForInvoice(order: Order): boolean {
//   return order.fulfillment_status === "delivered" && !order.invoice_id;
// }

// /** Order can be closed (all done) */
// export function isOrderComplete(order: Order): boolean {
//   return (
//     order.fulfillment_status === "delivered" && order.payment_status === "paid"
//   );
// }

// /** Dispatch readiness — future: will also check requires_approval */
// export function isOrderReadyForDispatch(order: Order): boolean {
//   if (order.order_status !== "confirmed") return false;
//   if (order.requires_approval && order.approval_status !== "approved")
//     return false;
//   return true;
// }

// // ── RELATED DATA LOOKUPS ─────────────────────────────────────────────────
// // These will be replaced by service calls once backend is live.

// export function getOrderDispatch(orderId: string) {
//   return dispatches.find((d) => d.order_id === orderId);
// }

// export function getOrderInvoice(orderId: string) {
//   return invoices.find((inv) => inv.order_id === orderId);
// }

// export function getOrderPayments(invoiceId?: string) {
//   if (!invoiceId) return [];
//   return payments.filter((p) => p.invoice_id === invoiceId);
// }

// export function getPaymentSummary(invoiceId?: string) {
//   const relatedPayments = getOrderPayments(invoiceId);
//   const amountPaid = relatedPayments.reduce((sum, p) => sum + p.amount, 0);
//   return { amountPaid, count: relatedPayments.length };
// }









// ============================================================
//  ORDERS SELECTORS
//  Pure functions. No imports from mock files. No side effects.
//  Always receive data as a parameter, transform it, return it.
//
//  TODAY:   called with data from the mock array via the hook
//  FUTURE:  called via select: in useQuery — nothing changes here
// ============================================================

import type {
  Order,
  OrderStatus,
  FulfillmentStatus,
  PaymentStatus,
  OrderKPIs,
} from "@/lib/modules/orders/types/orders.types";
import { Product } from "../../products/types/product.types";
import { CreateOrderFormValues } from "../schemas/create-order.schema";

// ── Single lookups ────────────────────────────────────────

export function getOrderById(
  orders: Order[],
  id: string
): Order | undefined {
  return orders.find((o) => o.id === id);
}

// ── Filters ───────────────────────────────────────────────

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
      o.order_status === "confirmed" && o.fulfillment_status === "pending"
  );
}

// ── Business rules ────────────────────────────────────────

export function canConfirmOrder(order: Order): boolean {
  return order.order_status === "draft";
}

export function canAssignToTrip(order: Order): boolean {
  return (
    order.order_status === "confirmed" &&
    order.fulfillment_status === "pending"
  );
}

export function isOrderReadyForInvoice(order: Order): boolean {
  return order.fulfillment_status === "delivered" && !order.invoice_id;
}

export function isOrderComplete(order: Order): boolean {
  return (
    order.fulfillment_status === "delivered" &&
    order.payment_status === "paid"
  );
}

export function isOrderReadyForDispatch(order: Order): boolean {
  if (order.order_status !== "confirmed") return false;
  if (order.requires_approval && order.approval_status !== "approved")
    return false;
  return true;
}

// ── KPIs ──────────────────────────────────────────────────

export function getOrderKPIs(orders: Order[]): OrderKPIs {
  return {
    totalOrders: orders.length,
    pendingDispatch: orders.filter(
      (o) =>
        o.order_status === "confirmed" && o.fulfillment_status === "pending"
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
        o.payment_status === "unpaid" || o.payment_status === "partially_paid"
    ).length,
    totalRevenue: orders.reduce((sum, o) => sum + o.total_amount, 0),
  };
}



export function getOrderDefaultValues(
  order: Order,
  products: Product[]
): Partial<CreateOrderFormValues> {
  const matchedProduct = products.find((p) => p.name === order.product_name);

  return {
    customer_id:      order.customer_id,
    order_type:       order.order_type as CreateOrderFormValues["order_type"],
    delivery_address: order.delivery_address,
    delivery_date:    order.delivery_date ?? "",
    notes:            order.notes ?? "",
    order_items: [
      {
        product_id: matchedProduct?.id ?? "",
        quantity:   order.quantity,
        unit_price: order.unit_price,
      },
    ],
  };
}
