// // // ============================================================
// // //  ORDERS SERVICE
// // //  Single source of truth for all order data operations.
// // //  Currently backed by mock data.
// // //  To connect real API: replace the mock operations with fetch() calls.
// // // ============================================================

// // import { orders } from "@/lib/mock/orders";
// // import type {
// //   Order,
// //   OrderStatus,
// //   FulfillmentStatus,
// //   PaymentStatus,
// //   CreateOrderInput,
// //   UpdateOrderInput,
// //   OrderKPIs,
// // } from "@/lib/modules/orders/orders.types";

// // export class OrdersService {
// //   // ── READ ────────────────────────────────────────────────

// //   static async getOrders(): Promise<Order[]> {
// //     // FUTURE: return fetch('/api/orders').then(r => r.json());
// //     return Promise.resolve([...orders]);
// //   }

// //   static async getOrderById(id: string): Promise<Order | undefined> {
// //     // FUTURE: return fetch(`/api/orders/${id}`).then(r => r.json());
// //     return Promise.resolve(orders.find((o) => o.id === id));
// //   }

// //   static async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
// //     return Promise.resolve(orders.filter((o) => o.order_status === status));
// //   }

// //   static async getOrdersByFulfillmentStatus(status: FulfillmentStatus): Promise<Order[]> {
// //     return Promise.resolve(orders.filter((o) => o.fulfillment_status === status));
// //   }

// //   static async getOrdersByTrip(tripId: string): Promise<Order[]> {
// //     return Promise.resolve(orders.filter((o) => o.trip_id === tripId));
// //   }

// //   // ── CREATE ──────────────────────────────────────────────

// //   static async createOrder(input: CreateOrderInput): Promise<Order> {
// //     const qty = parseFloat(input.quantity);
// //     const price = parseFloat(input.unit_price);
// //     const newOrder: Order = {
// //       id: `order-${Date.now()}`,
// //       order_number: `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
// //       customer_id: input.customer_id,
// //       customer_name: input.customer_id, // service layer will resolve name via customer lookup
// //       order_type: input.order_type,
// //       product_name: input.product_name,
// //       quantity: qty,
// //       unit_price: price,
// //       total_amount: qty * price,
// //       delivery_address: input.delivery_address,
// //       delivery_date: input.delivery_date || null,
// //       notes: input.notes,
// //       order_status: "draft",
// //       fulfillment_status: "pending",
// //       payment_status: "unpaid",
// //       created_at: new Date().toISOString().slice(0, 10),
// //     };

// //     // FUTURE: return fetch('/api/orders', { method: 'POST', body: JSON.stringify(input) }).then(r => r.json());
// //     orders.push(newOrder);
// //     return Promise.resolve(newOrder);
// //   }

// //   // ── UPDATE ──────────────────────────────────────────────

// //   static async updateOrder(id: string, input: UpdateOrderInput): Promise<Order> {
// //     const idx = orders.findIndex((o) => o.id === id);
// //     if (idx === -1) throw new Error(`Order ${id} not found`);

// //     const updated = { ...orders[idx], ...input };
// //     orders[idx] = updated;

// //     // FUTURE: return fetch(`/api/orders/${id}`, { method: 'PATCH', body: JSON.stringify(input) }).then(r => r.json());
// //     return Promise.resolve(updated);
// //   }

// //   // ── STATUS TRANSITIONS ──────────────────────────────────

// //   static async confirmOrder(id: string): Promise<Order> {
// //     return this.updateOrder(id, {
// //       order_status: "confirmed",
// //       fulfillment_status: "pending",
// //       confirmed_at: new Date().toISOString().slice(0, 10),
// //     } as any);
// //   }

// //   static async cancelOrder(id: string): Promise<Order> {
// //     return this.updateOrder(id, { order_status: "cancelled" });
// //   }

// //   static async closeOrder(id: string): Promise<Order> {
// //     // Only valid if delivered + paid
// //     const order = orders.find((o) => o.id === id);
// //     if (!order) throw new Error("Order not found");
// //     if (order.fulfillment_status !== "delivered") {
// //       throw new Error("Order must be delivered before closing");
// //     }
// //     if (order.payment_status !== "paid") {
// //       throw new Error("Order must be fully paid before closing");
// //     }
// //     return this.updateOrder(id, { order_status: "completed" });
// //   }

// //   // Called by TripService when a trip status changes
// //   static async updateFulfillmentStatus(id: string, status: FulfillmentStatus): Promise<Order> {
// //     const extra: Partial<Order> = { fulfillment_status: status };
// //     if (status === "delivered") {
// //       extra.delivered_at = new Date().toISOString().slice(0, 10);
// //     }
// //     return this.updateOrder(id, extra as UpdateOrderInput);
// //   }

// //   static async updatePaymentStatus(id: string, status: PaymentStatus): Promise<Order> {
// //     return this.updateOrder(id, { payment_status: status });
// //   }

// //   static async assignToTrip(orderId: string, tripId: string): Promise<Order> {
// //     return this.updateOrder(orderId, {
// //       trip_id: tripId,
// //       fulfillment_status: "assigned",
// //     });
// //   }

// //   static async setInvoice(orderId: string, invoiceId: string): Promise<Order> {
// //     return this.updateOrder(orderId, { invoice_id: invoiceId });
// //   }

// //   // ── COMPUTED / KPIs ─────────────────────────────────────

// //   static async getKPIs(): Promise<OrderKPIs> {
// //     const all = await this.getOrders();
// //     return {
// //       totalOrders: all.length,
// //       pendingDispatch: all.filter(
// //         (o) => o.order_status === "confirmed" && o.fulfillment_status === "pending"
// //       ).length,
// //       inTransit: all.filter(
// //         (o) =>
// //           o.fulfillment_status === "dispatched" ||
// //           o.fulfillment_status === "in_transit"
// //       ).length,
// //       delivered: all.filter((o) => o.fulfillment_status === "delivered").length,
// //       unpaidOrders: all.filter(
// //         (o) => o.payment_status === "unpaid" || o.payment_status === "partially_paid"
// //       ).length,
// //       totalRevenue: all.reduce((sum, o) => sum + o.total_amount, 0),
// //     };
// //   }
// // }

// // ============================================================
// //  ORDERS SELECTORS
// //  Pure transformation / business-logic functions.
// //  No data fetching here — data comes from the service layer.
// // ============================================================

// import { orders } from "@/lib/mock/orders";
// import { dispatches } from "@/lib/mock/dispatches";
// import { invoices } from "@/lib/mock/invoices";
// import { payments } from "@/lib/mock/payments";

// import type { Order, OrderStatus, FulfillmentStatus, PaymentStatus, OrderKPIs } from "@/lib/modules/orders/orders.types";

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
//         o.order_status === "confirmed" &&
//         o.fulfillment_status === "pending"
//     ).length,
//     inTransit: orderList.filter(
//       (o) =>
//         o.fulfillment_status === "dispatched" ||
//         o.fulfillment_status === "in_transit"
//     ).length,
//     delivered: orderList.filter((o) => o.fulfillment_status === "delivered").length,
//     unpaidOrders: orderList.filter(
//       (o) =>
//         o.payment_status === "unpaid" ||
//         o.payment_status === "partially_paid"
//     ).length,
//     totalRevenue: orderList.reduce((sum, o) => sum + o.total_amount, 0),
//   };
// }

// // ── FILTERS ──────────────────────────────────────────────────────────────

// export function getOrdersByStatus(orderList: Order[], status: OrderStatus): Order[] {
//   return orderList.filter((o) => o.order_status === status);
// }

// export function getOrdersByFulfillmentStatus(
//   orderList: Order[],
//   status: FulfillmentStatus
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
//     order.order_status === "confirmed" &&
//     (order.fulfillment_status === "pending")
//   );
// }

// /** Order is ready for invoice generation */
// export function isOrderReadyForInvoice(order: Order): boolean {
//   return order.fulfillment_status === "delivered" && !order.invoice_id;
// }

// /** Order can be closed (all done) */
// export function isOrderComplete(order: Order): boolean {
//   return (
//     order.fulfillment_status === "delivered" &&
//     order.payment_status === "paid"
//   );
// }

// /** Dispatch readiness — future: will also check requires_approval */
// export function isOrderReadyForDispatch(order: Order): boolean {
//   if (order.order_status !== "confirmed") return false;
//   if (order.requires_approval && order.approval_status !== "approved") return false;
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

// // ============================================================
// //  ORDERS SERVICE
// //  Single source of truth for all order data operations.
// //  Currently backed by mock data.
// //  To connect real API: replace the mock operations with fetch() calls.
// // ============================================================

// // import { orders } from "@/lib/mock/orders";
// import { orders } from "@/lib/modules/orders/mock/orders.mock";
// import type {
//   Order,
//   OrderStatus,
//   FulfillmentStatus,
//   PaymentStatus,
//   CreateOrderInput,
//   UpdateOrderInput,
//   OrderKPIs,
// } from "@/lib/modules/orders/types/orders.types";

// export class OrdersService {
//   // ── READ ────────────────────────────────────────────────

//   static async getOrders(): Promise<Order[]> {
//     // FUTURE: return fetch('/api/orders').then(r => r.json());
//     return Promise.resolve([...orders]);
//   }

//   static async getOrderById(id: string): Promise<Order | undefined> {
//     // FUTURE: return fetch(`/api/orders/${id}`).then(r => r.json());
//     return Promise.resolve(orders.find((o) => o.id === id));
//   }

//   static async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
//     return Promise.resolve(orders.filter((o) => o.order_status === status));
//   }

//   static async getOrdersByFulfillmentStatus(
//     status: FulfillmentStatus,
//   ): Promise<Order[]> {
//     return Promise.resolve(
//       orders.filter((o) => o.fulfillment_status === status),
//     );
//   }

//   static async getOrdersByTrip(tripId: string): Promise<Order[]> {
//     return Promise.resolve(orders.filter((o) => o.trip_id === tripId));
//   }

//   // ── CREATE ──────────────────────────────────────────────

//   static async createOrder(input: CreateOrderInput): Promise<Order> {
//     const qty = parseFloat(input.quantity);
//     const price = parseFloat(input.unit_price);
//     const newOrder: Order = {
//       id: `order-${Date.now()}`,
//       order_number: `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
//       customer_id: input.customer_id,
//       customer_name: input.customer_id, // service layer will resolve name via customer lookup
//       order_type: input.order_type,
//       product_name: input.product_name,
//       quantity: qty,
//       unit_price: price,
//       total_amount: qty * price,
//       delivery_address: input.delivery_address,
//       delivery_date: input.delivery_date || null,
//       notes: input.notes,
//       order_status: "draft",
//       fulfillment_status: "pending",
//       payment_status: "unpaid",
//       created_at: new Date().toISOString().slice(0, 10),
//     };

//     // FUTURE: return fetch('/api/orders', { method: 'POST', body: JSON.stringify(input) }).then(r => r.json());
//     orders.push(newOrder);
//     return Promise.resolve(newOrder);
//   }

//   // ── UPDATE ──────────────────────────────────────────────

//   static async updateOrder(
//     id: string,
//     input: UpdateOrderInput,
//   ): Promise<Order> {
//     const idx = orders.findIndex((o) => o.id === id);
//     if (idx === -1) throw new Error(`Order ${id} not found`);

//     const existing = orders[idx];
//     const quantity =
//       input.quantity !== undefined ? parseFloat(input.quantity) : existing.quantity;
//     const unitPrice =
//       input.unit_price !== undefined ? parseFloat(input.unit_price) : existing.unit_price;
//     const updated: Order = {
//       ...existing,
//       ...input,
//       quantity,
//       unit_price: unitPrice,
//       total_amount: quantity * unitPrice,
//       delivery_date:
//         input.delivery_date !== undefined
//           ? input.delivery_date || null
//           : existing.delivery_date,
//     };
//     orders[idx] = updated;

//     // FUTURE: return fetch(`/api/orders/${id}`, { method: 'PATCH', body: JSON.stringify(input) }).then(r => r.json());
//     return Promise.resolve(updated);
//   }

//   // ── STATUS TRANSITIONS ──────────────────────────────────

//   static async confirmOrder(id: string): Promise<Order> {
//     return this.updateOrder(id, {
//       order_status: "confirmed",
//       fulfillment_status: "pending",
//       confirmed_at: new Date().toISOString().slice(0, 10),
//     } as any);
//   }

//   static async cancelOrder(id: string): Promise<Order> {
//     return this.updateOrder(id, { order_status: "cancelled" });
//   }

//   static async closeOrder(id: string): Promise<Order> {
//     // Only valid if delivered + paid
//     const order = orders.find((o) => o.id === id);
//     if (!order) throw new Error("Order not found");
//     if (order.fulfillment_status !== "delivered") {
//       throw new Error("Order must be delivered before closing");
//     }
//     if (order.payment_status !== "paid") {
//       throw new Error("Order must be fully paid before closing");
//     }
//     return this.updateOrder(id, { order_status: "completed" });
//   }

//   // Called by TripService when a trip status changes
//   static async updateFulfillmentStatus(
//     id: string,
//     status: FulfillmentStatus,
//   ): Promise<Order> {
//     const extra: Partial<Order> = { fulfillment_status: status };
//     if (status === "delivered") {
//       extra.delivered_at = new Date().toISOString().slice(0, 10);
//     }
//     return this.updateOrder(id, extra as UpdateOrderInput);
//   }

//   static async updatePaymentStatus(
//     id: string,
//     status: PaymentStatus,
//   ): Promise<Order> {
//     return this.updateOrder(id, { payment_status: status });
//   }

//   static async assignToTrip(orderId: string, tripId: string): Promise<Order> {
//     return this.updateOrder(orderId, {
//       trip_id: tripId,
//       fulfillment_status: "assigned",
//     });
//   }

//   static async setInvoice(orderId: string, invoiceId: string): Promise<Order> {
//     return this.updateOrder(orderId, { invoice_id: invoiceId });
//   }

//   // ── COMPUTED / KPIs ─────────────────────────────────────

//   static async getKPIs(): Promise<OrderKPIs> {
//     const all = await this.getOrders();
//     return {
//       totalOrders: all.length,
//       pendingDispatch: all.filter(
//         (o) =>
//           o.order_status === "confirmed" && o.fulfillment_status === "pending",
//       ).length,
//       inTransit: all.filter(
//         (o) =>
//           o.fulfillment_status === "dispatched" ||
//           o.fulfillment_status === "in_transit",
//       ).length,
//       delivered: all.filter((o) => o.fulfillment_status === "delivered").length,
//       unpaidOrders: all.filter(
//         (o) =>
//           o.payment_status === "unpaid" ||
//           o.payment_status === "partially_paid",
//       ).length,
//       totalRevenue: all.reduce((sum, o) => sum + o.total_amount, 0),
//     };
//   }
// }









// ============================================================
//  ORDERS SERVICE
//  Single source of truth for all order operations
//  Mock-backed now → API-ready later
// ============================================================

import { orders } from "@/lib/modules/orders/mock/orders.mock";

import type {
  Order,
  OrderStatus,
  FulfillmentStatus,
  PaymentStatus,
  CreateOrderInput,
  UpdateOrderInput,
  OrderKPIs,
} from "@/lib/modules/orders/types/orders.types";

// ============================================================
// INTERNAL HELPERS
// ============================================================

function findOrderIndex(id: string) {
  return orders.findIndex((o) => o.id === id);
}

function cloneOrders() {
  return [...orders];
}

// ============================================================
// SERVICE OBJECT (namespaced, no class, no `this` issues)
// ============================================================

export const OrdersService = {
  // ─────────────────────────────────────────────
  // READ
  // ─────────────────────────────────────────────

  async getOrders(): Promise<Order[]> {
    return Promise.resolve(cloneOrders());
  },

  async getOrderById(id: string): Promise<Order | undefined> {
    return Promise.resolve(orders.find((o) => o.id === id));
  },

  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    return Promise.resolve(
      orders.filter((o) => o.order_status === status),
    );
  },

  async getOrdersByFulfillmentStatus(
    status: FulfillmentStatus,
  ): Promise<Order[]> {
    return Promise.resolve(
      orders.filter((o) => o.fulfillment_status === status),
    );
  },

  async getOrdersByTrip(tripId: string): Promise<Order[]> {
    return Promise.resolve(
      orders.filter((o) => o.trip_id === tripId),
    );
  },

  // ─────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────

  async createOrder(input: CreateOrderInput): Promise<Order> {
    const qty = parseFloat(input.quantity);
    const price = parseFloat(input.unit_price);

    const newOrder: Order = {
      id: `order-${Date.now()}`,
      order_number: `ORD-${new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "")}-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`,

      customer_id: input.customer_id,
      customer_name: input.customer_id,

      order_type: input.order_type,
      product_name: input.product_name,

      quantity: qty,
      unit_price: price,
      total_amount: qty * price,

      delivery_address: input.delivery_address,
      delivery_date: input.delivery_date || null,
      notes: input.notes,

      order_status: "draft",
      fulfillment_status: "pending",
      payment_status: "unpaid",

      created_at: new Date().toISOString().slice(0, 10),
    };

    orders.push(newOrder);
    return Promise.resolve(newOrder);
  },

  // ─────────────────────────────────────────────
  // UPDATE (CORE FIXED LOGIC HERE)
  // ─────────────────────────────────────────────

  async updateOrder(id: string, input: UpdateOrderInput): Promise<Order> {
    const idx = findOrderIndex(id);

    if (idx === -1) {
      throw new Error(`Order ${id} not found`);
    }

    const existing = orders[idx];

    const quantity =
      input.quantity !== undefined
        ? parseFloat(input.quantity)
        : existing.quantity;

    const unitPrice =
      input.unit_price !== undefined
        ? parseFloat(input.unit_price)
        : existing.unit_price;

    const updated: Order = {
      ...existing,
      ...input,
      quantity,
      unit_price: unitPrice,
      total_amount: quantity * unitPrice,
      delivery_date:
        input.delivery_date !== undefined
          ? input.delivery_date || null
          : existing.delivery_date,
    };

    orders[idx] = updated;

    return Promise.resolve(updated);
  },

  // ─────────────────────────────────────────────
  // STATUS TRANSITIONS
  // ─────────────────────────────────────────────

  async confirmOrder(id: string): Promise<Order> {
    return OrdersService.updateOrder(id, {
      order_status: "confirmed",
      fulfillment_status: "pending",
      confirmed_at: new Date().toISOString().slice(0, 10),
    } as any);
  },

  async cancelOrder(id: string): Promise<Order> {
    return OrdersService.updateOrder(id, {
      order_status: "cancelled",
    });
  },

  async closeOrder(id: string): Promise<Order> {
    const order = orders.find((o) => o.id === id);

    if (!order) throw new Error("Order not found");

    if (order.fulfillment_status !== "delivered") {
      throw new Error("Order must be delivered before closing");
    }

    if (order.payment_status !== "paid") {
      throw new Error("Order must be fully paid before closing");
    }

    return OrdersService.updateOrder(id, {
      order_status: "completed",
    });
  },

  async updateFulfillmentStatus(
    id: string,
    status: FulfillmentStatus,
  ): Promise<Order> {
    const extra: Partial<Order> = {
      fulfillment_status: status,
    };

    if (status === "delivered") {
      extra.delivered_at = new Date().toISOString().slice(0, 10);
    }

    return OrdersService.updateOrder(id, extra as UpdateOrderInput);
  },

  async updatePaymentStatus(
    id: string,
    status: PaymentStatus,
  ): Promise<Order> {
    return OrdersService.updateOrder(id, {
      payment_status: status,
    });
  },

  async assignToTrip(orderId: string, tripId: string): Promise<Order> {
    return OrdersService.updateOrder(orderId, {
      trip_id: tripId,
      fulfillment_status: "assigned",
    });
  },

  async setInvoice(orderId: string, invoiceId: string): Promise<Order> {
    return OrdersService.updateOrder(orderId, {
      invoice_id: invoiceId,
    });
  },

  // ─────────────────────────────────────────────
  // KPIs
  // ─────────────────────────────────────────────

  async getKPIs(): Promise<OrderKPIs> {
    const all = await OrdersService.getOrders();

    return {
      totalOrders: all.length,
      pendingDispatch: all.filter(
        (o) =>
          o.order_status === "confirmed" &&
          o.fulfillment_status === "pending",
      ).length,

      inTransit: all.filter(
        (o) =>
          o.fulfillment_status === "dispatched" ||
          o.fulfillment_status === "in_transit",
      ).length,

      delivered: all.filter(
        (o) => o.fulfillment_status === "delivered",
      ).length,

      unpaidOrders: all.filter(
        (o) =>
          o.payment_status === "unpaid" ||
          o.payment_status === "partially_paid",
      ).length,

      totalRevenue: all.reduce((sum, o) => sum + o.total_amount, 0),
    };
  },
};
