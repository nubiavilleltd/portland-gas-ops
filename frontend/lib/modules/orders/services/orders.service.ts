
// // ============================================================
// //  ORDERS SERVICE
// //  Single source of truth for all order operations
// //  Mock-backed now → API-ready later
// // ============================================================

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
// import { generateOrderId, generateOrderNumber } from "../utils";

// // ============================================================
// // INTERNAL HELPERS
// // ============================================================

// function findOrderIndex(id: string) {
//   return orders.findIndex((o) => o.id === id);
// }

// function cloneOrders() {
//   return [...orders];
// }

// // ============================================================
// // SERVICE OBJECT (namespaced, no class, no `this` issues)
// // ============================================================

// export const OrdersService = {
//   // ─────────────────────────────────────────────
//   // READ
//   // ─────────────────────────────────────────────

//   async getOrders(): Promise<Order[]> {
//     return Promise.resolve(cloneOrders());
//   },

//   async getOrderById(id: string): Promise<Order | undefined> {
//     return Promise.resolve(orders.find((o) => o.id === id));
//   },

//   async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
//     return Promise.resolve(
//       orders.filter((o) => o.order_status === status),
//     );
//   },

//   async getOrdersByFulfillmentStatus(
//     status: FulfillmentStatus,
//   ): Promise<Order[]> {
//     return Promise.resolve(
//       orders.filter((o) => o.fulfillment_status === status),
//     );
//   },

//   async getOrdersByTrip(tripId: string): Promise<Order[]> {
//     return Promise.resolve(
//       orders.filter((o) => o.trip_id === tripId),
//     );
//   },


// async createDraftOrder(input: CreateOrderInput): Promise<Order> {
//   const newOrder: Order = {
//     id: generateOrderId(),
//     order_number: generateOrderNumber(),

//     customer_id: input.customer_id,
//     customer_name: input.customer_id,

//     order_type: input.order_type,
//     product_name: input.product_name,

//     quantity: parseFloat(input.quantity),
//     unit_price: parseFloat(input.unit_price),
//     total_amount: parseFloat(input.quantity) * parseFloat(input.unit_price),

//     delivery_address: input.delivery_address,
//     delivery_date: input.delivery_date || null,
//     notes: input.notes,

//     order_status: "draft",
//     fulfillment_status: "pending",
//     payment_status: "unpaid",

//     created_at: new Date().toISOString(),
//   };

//   orders.push(newOrder);
//   return newOrder;
// },

// async updateDraftOrder(
//   id: string,
//   input: Partial<CreateOrderInput>
// ): Promise<Order> {
//   const idx = findOrderIndex(id);

//   if (idx === -1) throw new Error("Order not found");

//   const existing = orders[idx];

//   const updated: Order = {
//     ...existing,

//     // ONLY editable fields
//     customer_id: input.customer_id ?? existing.customer_id,
//     order_type: input.order_type ?? existing.order_type,
//     product_name: input.product_name ?? existing.product_name,
//     delivery_address: input.delivery_address ?? existing.delivery_address,
//     delivery_date: input.delivery_date ?? existing.delivery_date,
//     notes: input.notes ?? existing.notes,

//     quantity: input.quantity
//       ? parseFloat(input.quantity)
//       : existing.quantity,

//     unit_price: input.unit_price
//       ? parseFloat(input.unit_price)
//       : existing.unit_price,

//     total_amount:
//       (input.quantity ? parseFloat(input.quantity) : existing.quantity) *
//       (input.unit_price ? parseFloat(input.unit_price) : existing.unit_price),
//   };

//   orders[idx] = updated;

//   return updated;
// },

//   // ─────────────────────────────────────────────
//   // CREATE
//   // ─────────────────────────────────────────────

//   async createOrder(input: CreateOrderInput): Promise<Order> {
//     const qty = parseFloat(input.quantity);
//     const price = parseFloat(input.unit_price);

//     const newOrder: Order = {
//       id: generateOrderId(),
//       order_number: generateOrderNumber(),

//       customer_id: input.customer_id,
//       customer_name: input.customer_id,

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

//     orders.push(newOrder);
//     return Promise.resolve(newOrder);
//   },

//   // ─────────────────────────────────────────────
//   // UPDATE (CORE FIXED LOGIC HERE)
//   // ─────────────────────────────────────────────

//   async updateOrder(id: string, input: UpdateOrderInput): Promise<Order> {
//     const idx = findOrderIndex(id);

//     if (idx === -1) {
//       throw new Error(`Order ${id} not found`);
//     }

//     const existing = orders[idx];

//     const quantity =
//       input.quantity !== undefined
//         ? parseFloat(input.quantity)
//         : existing.quantity;

//     const unitPrice =
//       input.unit_price !== undefined
//         ? parseFloat(input.unit_price)
//         : existing.unit_price;

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

//     return Promise.resolve(updated);
//   },

//   // ─────────────────────────────────────────────
//   // STATUS TRANSITIONS
//   // ─────────────────────────────────────────────

//   async confirmOrder(id: string): Promise<Order> {
//     return OrdersService.updateOrder(id, {
//       order_status: "confirmed",
//       fulfillment_status: "pending",
//       confirmed_at: new Date().toISOString().slice(0, 10),
//     } as any);
//   },

//   async cancelOrder(id: string): Promise<Order> {
//     return OrdersService.updateOrder(id, {
//       order_status: "cancelled",
//     });
//   },

//   async closeOrder(id: string): Promise<Order> {
//     const order = orders.find((o) => o.id === id);

//     if (!order) throw new Error("Order not found");

//     if (order.fulfillment_status !== "delivered") {
//       throw new Error("Order must be delivered before closing");
//     }

//     if (order.payment_status !== "paid") {
//       throw new Error("Order must be fully paid before closing");
//     }

//     return OrdersService.updateOrder(id, {
//       order_status: "completed",
//     });
//   },

//   async updateFulfillmentStatus(
//     id: string,
//     status: FulfillmentStatus,
//   ): Promise<Order> {
//     const extra: Partial<Order> = {
//       fulfillment_status: status,
//     };

//     if (status === "delivered") {
//       extra.delivered_at = new Date().toISOString().slice(0, 10);
//     }

//     return OrdersService.updateOrder(id, extra as UpdateOrderInput);
//   },

//   async updatePaymentStatus(
//     id: string,
//     status: PaymentStatus,
//   ): Promise<Order> {
//     return OrdersService.updateOrder(id, {
//       payment_status: status,
//     });
//   },

//   async assignToTrip(orderId: string, tripId: string): Promise<Order> {
//     return OrdersService.updateOrder(orderId, {
//       trip_id: tripId,
//       fulfillment_status: "assigned",
//     });
//   },

//   async setInvoice(orderId: string, invoiceId: string): Promise<Order> {
//     return OrdersService.updateOrder(orderId, {
//       invoice_id: invoiceId,
//     });
//   },

//   // ─────────────────────────────────────────────
//   // KPIs
//   // ─────────────────────────────────────────────

//   async getKPIs(): Promise<OrderKPIs> {
//     const all = await OrdersService.getOrders();

//     return {
//       totalOrders: all.length,
//       pendingDispatch: all.filter(
//         (o) =>
//           o.order_status === "confirmed" &&
//           o.fulfillment_status === "pending",
//       ).length,

//       inTransit: all.filter(
//         (o) =>
//           o.fulfillment_status === "dispatched" ||
//           o.fulfillment_status === "in_transit",
//       ).length,

//       delivered: all.filter(
//         (o) => o.fulfillment_status === "delivered",
//       ).length,

//       unpaidOrders: all.filter(
//         (o) =>
//           o.payment_status === "unpaid" ||
//           o.payment_status === "partially_paid",
//       ).length,

//       totalRevenue: all.reduce((sum, o) => sum + o.total_amount, 0),
//     };
//   },
// };








// ============================================================
//  ORDERS SERVICE
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
import { generateOrderId, generateOrderNumber } from "../utils";

// ============================================================
// INTERNAL HELPERS
// ============================================================

function findOrderIndex(id: string) {
  return orders.findIndex((o) => o.id === id);
}

function getOrThrow(id: string): { order: Order; idx: number } {
  const idx = findOrderIndex(id);
  if (idx === -1) throw new Error(`Order ${id} not found`);
  return { order: orders[idx], idx };
}

// ── Shared payload builder ────────────────────────────────
// Merges a partial input on top of an existing order (or blank slate).
// Used by create, update, and draft flows to avoid duplication.

function buildOrderPayload(
  input: Partial<CreateOrderInput>,
  existing?: Partial<Order>
): Partial<Order> {
  const quantity =
    input.quantity !== undefined
      ? parseFloat(input.quantity)
      : existing?.quantity ?? 0;

  const unitPrice =
    input.unit_price !== undefined
      ? parseFloat(input.unit_price)
      : existing?.unit_price ?? 0;

  return {
    customer_id: input.customer_id ?? existing?.customer_id ?? "",
    // customer_name is resolved from customer_id — replace with lookup when API is ready
    customer_name: input.customer_id ?? existing?.customer_name ?? "",
    order_type: input.order_type ?? existing?.order_type ?? "",
    product_name: input.product_name ?? existing?.product_name ?? "",
    quantity,
    unit_price: unitPrice,
    total_amount: quantity * unitPrice,
    delivery_address: input.delivery_address ?? existing?.delivery_address ?? "",
    delivery_date:
      input.delivery_date !== undefined
        ? input.delivery_date || null
        : existing?.delivery_date ?? null,
    notes: input.notes ?? existing?.notes ?? "",
  };
}

// ============================================================
// SERVICE
// ============================================================

export const OrdersService = {

  // ── READ ────────────────────────────────────────────────

  async getOrders(): Promise<Order[]> {
    return Promise.resolve([...orders]);
  },

  async getOrderById(id: string): Promise<Order | undefined> {
    return Promise.resolve(orders.find((o) => o.id === id));
  },

  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    return Promise.resolve(orders.filter((o) => o.order_status === status));
  },

  async getOrdersByFulfillmentStatus(status: FulfillmentStatus): Promise<Order[]> {
    return Promise.resolve(orders.filter((o) => o.fulfillment_status === status));
  },

  async getOrdersByTrip(tripId: string): Promise<Order[]> {
    return Promise.resolve(orders.filter((o) => o.trip_id === tripId));
  },

  // ── DRAFT FLOW ──────────────────────────────────────────
  // Step 1: Save as draft — generates ID once
  async createDraftOrder(input: CreateOrderInput): Promise<Order> {
    const newOrder: Order = {
      id: generateOrderId(),
      order_number: generateOrderNumber(),
      ...buildOrderPayload(input),
      order_status: "draft",
      fulfillment_status: "pending",
      payment_status: "unpaid",
      created_at: new Date().toISOString(),
    } as Order;

    orders.push(newOrder);
    return newOrder;
  },

  // Step 2: Update draft — reuses same ID, never generates a new one
  async updateDraftOrder(id: string, input: Partial<CreateOrderInput>): Promise<Order> {
    const { order, idx } = getOrThrow(id);

    if (order.order_status !== "draft") {
      throw new Error("Only draft orders can be updated this way");
    }

    const updated: Order = {
      ...order,
      ...buildOrderPayload(input, order),
    } as Order;

    orders[idx] = updated;
    return updated;
  },

  async createOrder(input: CreateOrderInput, existingId?: string): Promise<Order> {
    // If a draft already exists, update it and confirm it — never generate a new ID
    if (existingId) {
      const { order, idx } = getOrThrow(existingId);
      const updated: Order = {
        ...order,
        ...buildOrderPayload(input, order),
        order_status: "submitted",
        fulfillment_status: "pending",
        payment_status: "unpaid",
      } as Order;
      orders[idx] = updated;
      return Promise.resolve(updated);
    }

    // No draft — fresh submission, generate ID once
    const newOrder: Order = {
      id: generateOrderId(),
      order_number: generateOrderNumber(),
      ...buildOrderPayload(input),
      order_status: "submitted",
      fulfillment_status: "pending",
      payment_status: "unpaid",
      created_at: new Date().toISOString().slice(0, 10),
    } as Order;

    orders.push(newOrder);
    return Promise.resolve(newOrder);
  },

  // Add this to the service alongside confirmOrder
async submitOrder(id: string): Promise<Order> {
  return OrdersService.updateOrder(id, {
    order_status: "submitted",
  });
},


  // ── UPDATE ──────────────────────────────────────────────
  async updateOrder(id: string, input: UpdateOrderInput): Promise<Order> {
    const { order, idx } = getOrThrow(id);

    const updated: Order = {
      ...order,
      ...buildOrderPayload(input, order),
      // Pass through any status fields from input directly
      ...(input.order_status && { order_status: input.order_status }),
      ...(input.fulfillment_status && { fulfillment_status: input.fulfillment_status }),
      ...(input.payment_status && { payment_status: input.payment_status }),
      ...(input.trip_id && { trip_id: input.trip_id }),
      ...(input.invoice_id && { invoice_id: input.invoice_id }),
    } as Order;

    orders[idx] = updated;
    return Promise.resolve(updated);
  },

  // ── STATUS TRANSITIONS ───────────────────────────────────

  async confirmOrder(id: string): Promise<Order> {
    return OrdersService.updateOrder(id, {
      order_status: "confirmed",
      fulfillment_status: "pending",
    } as UpdateOrderInput);
  },

  async cancelOrder(id: string): Promise<Order> {
    return OrdersService.updateOrder(id, { order_status: "cancelled" });
  },

  async closeOrder(id: string): Promise<Order> {
    const { order } = getOrThrow(id);

    if (order.fulfillment_status !== "delivered") {
      throw new Error("Order must be delivered before closing");
    }
    if (order.payment_status !== "paid") {
      throw new Error("Order must be fully paid before closing");
    }

    return OrdersService.updateOrder(id, { order_status: "completed" });
  },

  async updateFulfillmentStatus(id: string, status: FulfillmentStatus): Promise<Order> {
    const extra: Partial<Order> = { fulfillment_status: status };
    if (status === "delivered") {
      extra.delivered_at = new Date().toISOString().slice(0, 10);
    }
    return OrdersService.updateOrder(id, extra as UpdateOrderInput);
  },

  async updatePaymentStatus(id: string, status: PaymentStatus): Promise<Order> {
    return OrdersService.updateOrder(id, { payment_status: status });
  },

  async assignToTrip(orderId: string, tripId: string): Promise<Order> {
    return OrdersService.updateOrder(orderId, {
      trip_id: tripId,
      fulfillment_status: "assigned",
    });
  },

  async setInvoice(orderId: string, invoiceId: string): Promise<Order> {
    return OrdersService.updateOrder(orderId, { invoice_id: invoiceId });
  },

  // ── KPIs ────────────────────────────────────────────────

  async getKPIs(): Promise<OrderKPIs> {
    const all = await OrdersService.getOrders();
    return {
      totalOrders: all.length,
      pendingDispatch: all.filter(
        (o) => o.order_status === "confirmed" && o.fulfillment_status === "pending"
      ).length,
      inTransit: all.filter(
        (o) => o.fulfillment_status === "dispatched" || o.fulfillment_status === "in_transit"
      ).length,
      delivered: all.filter((o) => o.fulfillment_status === "delivered").length,
      unpaidOrders: all.filter((o) => o.payment_status === "unpaid" || o.payment_status === "partially_paid").length,
      totalRevenue: all.reduce((sum, o) => sum + o.total_amount, 0),
    };
  },
};
