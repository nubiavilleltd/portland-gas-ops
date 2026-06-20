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
import { ItemDisposition } from "../../inventory/types/inventory.types";

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

function mergeOrderPayload(
  input: Partial<CreateOrderInput>,
  existing?: Partial<Order>
): Partial<Order> {
  const order_items = input.order_items ?? existing?.order_items ?? [];
  const total_amount = order_items.reduce((sum, item) => sum + item.total, 0);

  return {
    customer_id: input.customer_id ?? existing?.customer_id ?? "",
    customer_name: input.customer_id ?? existing?.customer_name ?? "",
    order_items,
    total_amount,
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
      ...mergeOrderPayload(input),
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
      ...mergeOrderPayload(input, order),
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
        ...mergeOrderPayload(input, order),
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
      ...mergeOrderPayload(input),
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
    ...mergeOrderPayload(input, order),
    ...(input.order_status && { order_status: input.order_status }),
    ...(input.fulfillment_status && { fulfillment_status: input.fulfillment_status }),
    ...(input.payment_status && { payment_status: input.payment_status }),
    ...(input.trip_id !== undefined && { trip_id: input.trip_id }),
    ...(input.invoice_id && { invoice_id: input.invoice_id }),
    ...(input.cancellation_reason !== undefined && { cancellation_reason: input.cancellation_reason }),
    ...(input.cancelled_at !== undefined && { cancelled_at: input.cancelled_at }),
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

 async cancelOrder(id: string, reason?: string): Promise<Order> {
  return OrdersService.updateOrder(id, {
    order_status: "cancelled",
    fulfillment_status: "pending",
    trip_id: null,
    cancellation_reason: reason,
    cancelled_at: new Date().toISOString(),
  } as UpdateOrderInput);
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

  const updated = await OrdersService.updateOrder(id, extra as UpdateOrderInput);

  // Auto-close when delivered — payment is guaranteed before delivery in this model
  if (status === "delivered" && updated.payment_status === "paid") {
    return OrdersService.updateOrder(id, { order_status: "completed" });
  }

  return updated;
},


  async updatePaymentStatus(id: string, status: PaymentStatus): Promise<Order> {
  const extra: UpdateOrderInput = { payment_status: status };

  if (status === "paid") {
    extra.order_status = "confirmed";
  }

  return OrdersService.updateOrder(id, extra);
},

// Add to orders.service.ts
async updateOrderLineItem(
  orderId: string,
  productId: string,
  inventoryItemIds: string[],
  disposition: ItemDisposition,
): Promise<Order> {
  const { order, idx } = getOrThrow(orderId);

  const updatedItems = order.order_items?.map((item) =>
    item.product_id === productId
      ? { ...item, inventory_item_ids: inventoryItemIds, disposition }
      : item
  ) ?? [];

  orders[idx] = { ...order, order_items: updatedItems };
  return Promise.resolve(orders[idx]);
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
        (o) => o.fulfillment_status === "in_transit"
      ).length,
      delivered: all.filter((o) => o.fulfillment_status === "delivered").length,
      unpaidOrders: all.filter((o) => o.payment_status === "unpaid" || o.payment_status === "partially_paid").length,
      totalRevenue: all.reduce((sum, o) => sum + o.total_amount, 0),
    };
  },
};

