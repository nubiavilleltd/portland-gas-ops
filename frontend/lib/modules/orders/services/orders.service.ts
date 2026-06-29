

import { ordersApi } from "../api/orders.api";
import { adaptOrder, adaptOrderList } from "../adapters/order.adapter";
import { getErrorMessage } from "@/lib/api/error";
import type { Order, CreateOrderInput, UpdateOrderInput, OrderStatus, FulfillmentStatus } from "../types/orders.types";
import type { PaymentStatus } from "../../payments/types/payments.types";

export const OrdersService = {
  async getOrders(): Promise<Order[]> {
    const raw = await ordersApi.list({ page_size: 200 });
    return adaptOrderList(raw);
  },

  async getOrderById(id: string): Promise<Order | undefined> {
    try {
      const raw = await ordersApi.get(id);
      return adaptOrder(raw);
    } catch { return undefined; }
  },

  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    const raw = await ordersApi.list({ order_status: status, page_size: 200 });
    return adaptOrderList(raw);
  },

  async getOrdersByFulfillmentStatus(status: FulfillmentStatus): Promise<Order[]> {
    const raw = await ordersApi.list({ fulfillment_status: status, page_size: 200 });
    return adaptOrderList(raw);
  },

  async getOrdersByTrip(tripId: string): Promise<Order[]> {
    // When trips are built, filter on backend. For now fetch all and filter.
    const raw = await ordersApi.list({ page_size: 200 });
    return adaptOrderList(raw).filter(o => o.trip_id === tripId);
  },

  async createDraftOrder(input: CreateOrderInput): Promise<Order> {
    try {
      const raw = await ordersApi.createDraft(input);
      return adaptOrder(raw);
    } catch (err) { throw new Error(getErrorMessage(err, "Failed to create order")); }
  },

  async updateDraftOrder(id: string, input: Partial<CreateOrderInput>): Promise<Order> {
    try {
      const raw = await ordersApi.update(id, input);
      return adaptOrder(raw);
    } catch (err) { throw new Error(getErrorMessage(err, "Failed to update order")); }
  },

  async createOrder(input: CreateOrderInput): Promise<Order> {
    // No draft — create and submit in one shot
    try {
      const draft = await ordersApi.createDraft(input);
      const submitted = await ordersApi.submit(draft.order_no);
      return adaptOrder(submitted);
    } catch (err) { throw new Error(getErrorMessage(err, "Failed to submit order")); }
  },

  async submitOrder(id: string): Promise<Order> {
    try {
      const raw = await ordersApi.submit(id);
      return adaptOrder(raw);
    } catch (err) { throw new Error(getErrorMessage(err, "Failed to submit order")); }
  },

  async confirmOrder(id: string): Promise<Order> {
    try {
      const raw = await ordersApi.confirm(id);
      return adaptOrder(raw);
    } catch (err) { throw new Error(getErrorMessage(err, "Failed to confirm order")); }
  },

  async cancelOrder(id: string, reason?: string): Promise<Order> {
    try {
      const raw = await ordersApi.cancel(id, reason);
      return adaptOrder(raw);
    } catch (err) { throw new Error(getErrorMessage(err, "Failed to cancel order")); }
  },

  async closeOrder(id: string): Promise<Order> {
    // confirmDelivery handles the close — this is called by confirmDeliveryWorkflow
    // which already calls updateFulfillmentStatus then closeOrder
    // With backend: confirmDelivery endpoint does both atomically
    try {
      const raw = await ordersApi.confirmDelivery(id);
      return adaptOrder(raw);
    } catch (err) { throw new Error(getErrorMessage(err, "Failed to close order")); }
  },

  async updateFulfillmentStatus(id: string, status: FulfillmentStatus): Promise<Order> {
    try {
      const raw = await ordersApi.updateFulfillment(id, status);
      return adaptOrder(raw);
    } catch (err) { throw new Error(getErrorMessage(err, "Failed to update fulfillment")); }
  },

  async updatePaymentStatus(id: string, status: PaymentStatus): Promise<Order> {
    // Backend handles this automatically as part of payment cascade
    // This method is kept for mock compatibility but is a no-op with real backend
    // The backend payment endpoint updates the order automatically
    return OrdersService.getOrderById(id) as Promise<Order>;
  },

  async updateOrderLineItem(orderId: string, productId: string, inventoryItemIds: string[], disposition: any): Promise<Order> {
    // Will be implemented when inventory is built
    return OrdersService.getOrderById(orderId) as Promise<Order>;
  },

  async assignToTrip(orderId: string, tripId: string): Promise<Order> {
    try {
      const raw = await ordersApi.setTrip(orderId, tripId);
      return adaptOrder(raw);
    } catch (err) { throw new Error(getErrorMessage(err, "Failed to assign trip")); }
  },
  async setTrip(id: string, tripId: string | null): Promise<Order | undefined> {
    try {
      const raw = await ordersApi.setTrip(id, tripId);
      return adaptOrder(raw);
    } catch { return undefined; }
  },

  async setInvoice(orderId: string, invoiceId: string): Promise<Order> {
    try {
      const raw = await ordersApi.setInvoice(orderId, invoiceId);
      return adaptOrder(raw);
    } catch (err) { throw new Error(getErrorMessage(err, "Failed to link invoice")); }
  },

  async getKPIs() {
    const orders = await OrdersService.getOrders();
    const active = orders.filter(o => o.order_status !== "cancelled");
    return {
      totalOrders: orders.length,
      pendingDispatch: active.filter(o => o.order_status === "confirmed" && o.fulfillment_status === "pending").length,
      inTransit: active.filter(o => o.fulfillment_status === "in_transit").length,
      delivered: active.filter(o => o.fulfillment_status === "delivered").length,
      unpaidOrders: active.filter(o => ["unpaid", "partially_paid"].includes(o.payment_status)).length,
      totalRevenue: active.reduce((sum, o) => sum + o.total_amount, 0),
    };
  },
};
