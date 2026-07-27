

import { ordersApi } from "../api/orders.api";
import {
  adaptOrder,
  adaptOrderList,
  adaptCreateOrderRequest,
  adaptSaveDraftRequest,
} from "../adapters/order.adapter";

import type {
  ConfirmDeliveryPayload,
  CreateOrderInput,
  FulfillmentStatus,
  Order,
  OrderKPIs,
  OrderStatus,
  SaveDraftInput,
} from "../types/orders.types";

import type { PaymentStatus } from "../../payments/types/payments.types";
import { ItemDisposition } from "../../inventory/types/inventory.types";
import { getErrorMessage } from "@/lib/errors";
import { ORDER_ERROR_MESSAGES } from "../errors";
import { ERROR_MESSAGES } from "@/lib/api/error";

export const OrdersService = {
  // ------------------------------------------------------------------
  // Queries
  // ------------------------------------------------------------------

  async getOrders(): Promise<Order[]> {
    const raw = await ordersApi.list({ page_size: 200 });
    return adaptOrderList(raw);
  },

  async getOrderById(orderId: string): Promise<Order> {
    try {
      const raw = await ordersApi.get(orderId);

      return adaptOrder(raw);
    } catch (err) {
      throw new Error(getErrorMessage(err, ORDER_ERROR_MESSAGES, "Failed to load order"));
    }
  },

  async getOrdersByStatus(
    status: OrderStatus,
  ): Promise<Order[]> {
    const raw = await ordersApi.list({
      order_status: status,
      page_size: 200,
    });

    return adaptOrderList(raw);
  },

  async getOrdersByFulfillmentStatus(
    status: FulfillmentStatus,
  ): Promise<Order[]> {
    const raw = await ordersApi.list({
      fulfillment_status: status,
      page_size: 200,
    });

    return adaptOrderList(raw);
  },

  async getOrdersByTrip(
    tripId: string,
  ): Promise<Order[]> {
    // TODO:
    // Replace with backend filtering once the Trips module
    // exposes a dedicated endpoint/filter.
    const orders = await this.getOrders();

    return orders.filter((order) => order.tripId === tripId);
  },

  // ------------------------------------------------------------------
  // Draft lifecycle
  // ------------------------------------------------------------------

  async createDraftOrder(
    input: SaveDraftInput,
  ): Promise<Order> {
    try {
      const raw = await ordersApi.createDraft(
        adaptSaveDraftRequest(input),
      );

      return adaptOrder(raw);
    } catch (err) {
      throw new Error(
        getErrorMessage(err, ORDER_ERROR_MESSAGES, "Failed to create draft order"),
      );
    }
  },

  async updateDraftOrder(
    orderid: string,
    input: SaveDraftInput,
  ): Promise<Order> {
    try {
      const raw = await ordersApi.update(
        orderid,
        adaptSaveDraftRequest(input),
      );

      return adaptOrder(raw);
    } catch (err) {
      throw new Error(
        getErrorMessage(err, ORDER_ERROR_MESSAGES, "Failed to update draft order"),
      );
    }
  },

  async submitOrder(
    orderid: string,
  ): Promise<Order> {
    try {
      const raw = await ordersApi.submit(orderid);

      return adaptOrder(raw);
    } catch (err) {
      throw new Error(
        getErrorMessage(err, ORDER_ERROR_MESSAGES, "Failed to submit order"),
      );
    }
  },

async createOrder(
  input: CreateOrderInput,
): Promise<Order> {
  try {
    const raw = await ordersApi.createAndSubmit(
      adaptCreateOrderRequest(input),
    );

    return adaptOrder(raw);
  } catch (err) {
    throw new Error(
      getErrorMessage(err, ORDER_ERROR_MESSAGES, "Failed to create and submit order"),
    );
  }
},
  // ------------------------------------------------------------------
  // Order actions
  // ------------------------------------------------------------------

  async cancelOrder(
    orderid: string,
    reason?: string,
  ): Promise<Order> {
    try {
      return adaptOrder(
        await ordersApi.cancel(orderid, reason),
      );
    } catch (err) {
      throw new Error(
        getErrorMessage(err, ORDER_ERROR_MESSAGES, "Failed to cancel order"),
      );
    }
  },

  async confirmDelivery(
    orderId: string,
    payload:ConfirmDeliveryPayload,
  ): Promise<Order> {
    try {
      return adaptOrder(
        await ordersApi.confirmDelivery(orderId, payload),
      );
    } catch (err) {
      throw new Error(
        getErrorMessage(err, ORDER_ERROR_MESSAGES, "Failed to confirm delivery"),
      );
    }
  },

  // ------------------------------------------------------------------
  // Fulfillment
  // ------------------------------------------------------------------

  async updateFulfillmentStatus(
    orderid: string,
    status: FulfillmentStatus,
  ): Promise<Order> {
    try {
      return adaptOrder(
        await ordersApi.updateFulfillment(
          orderid,
          status,
        ),
      );
    } catch (err) {
      throw new Error(
        getErrorMessage(
          err,
          ORDER_ERROR_MESSAGES,
          "Failed to update fulfillment status",
        ),
      );
    }
  },

  // ------------------------------------------------------------------
  // Payment
  // ------------------------------------------------------------------

  /**
   * Temporary compatibility method.
   *
   * Payment status is owned by the Payments module.
   * Orders never update payment status directly.
   *
   * Remove this method once all callers have migrated.
   */
  async updatePaymentStatus(
    orderId: string,
    _status: PaymentStatus,
  ): Promise<Order> {
    return this.getOrderById(orderId);
  },

  // ------------------------------------------------------------------
  // Inventory
  // ------------------------------------------------------------------

  async updateOrderLineItem(
    orderId: string,
    productId: string,
    inventoryItemIds: string[],
    disposition: ItemDisposition,
  ): Promise<Order> {
    // TODO:
    // Implement when the Inventory module is complete.
    void productId;
    void inventoryItemIds;
    void disposition;

    return this.getOrderById(orderId);
  },

  // ------------------------------------------------------------------
  // Relationships
  // ------------------------------------------------------------------

  async assignToTrip(
    orderId: string,
    tripId: string,
  ): Promise<Order> {
    try {
      return adaptOrder(
        await ordersApi.setTrip(orderId, tripId),
      );
    } catch (err) {
      throw new Error(
        getErrorMessage(err, ORDER_ERROR_MESSAGES, "Failed to assign trip"),
      );
    }
  },

  async setTrip(
    orderId: string,
    tripId: string | null,
  ): Promise<Order> {
    try {
      return adaptOrder(
        await ordersApi.setTrip(orderId, tripId),
      );
    } catch (err) {
      throw new Error(
        getErrorMessage(err, ORDER_ERROR_MESSAGES, "Failed to update trip"),
      );
    }
  },

  async setInvoice(
    orderId: string,
    invoiceId: string,
  ): Promise<Order> {
    try {
      return adaptOrder(
        await ordersApi.setInvoice(orderId, invoiceId),
      );
    } catch (err) {
      throw new Error(
        getErrorMessage(err, ORDER_ERROR_MESSAGES, "Failed to link invoice"),
      );
    }
  },

  // ------------------------------------------------------------------
  // Dashboard
  // ------------------------------------------------------------------

  async getKPIs(): Promise<OrderKPIs> {
    // TODO:
    // Move KPI calculation to the backend once a dedicated
    // dashboard endpoint becomes available.

    const orders = await this.getOrders();

    const activeOrders = orders.filter(
      (order) => order.orderStatus !== "cancelled",
    );

    return {
      totalOrders: orders.length,

      pendingDispatch: activeOrders.filter(
        (order) =>
          order.orderStatus === "confirmed" &&
          order.fulfillmentStatus === "pending",
      ).length,

      inTransit: activeOrders.filter(
        (order) =>
          order.fulfillmentStatus === "in_transit",
      ).length,

      delivered: activeOrders.filter(
        (order) =>
          order.fulfillmentStatus === "delivered",
      ).length,

      unpaidOrders: activeOrders.filter((order) =>
        ["unpaid", "partially_paid"].includes(
          order.paymentStatus,
        ),
      ).length,

      totalRevenue: activeOrders.reduce(
        (sum, order) => sum + order.totalAmount,
        0,
      ),
    };
  },
};
