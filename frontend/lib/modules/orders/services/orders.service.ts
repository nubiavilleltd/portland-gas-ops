
import { getErrorMessage } from "@/lib/api/error";

import { ordersApi } from "../api/orders.api";
import {
  adaptOrder,
  adaptOrderList,
  adaptCreateOrderRequest,
  adaptUpdateOrderRequest,
} from "../adapters/order.adapter";

import type {
  CreateOrderInput,
  FulfillmentStatus,
  Order,
  OrderKPIs,
  OrderStatus,
  UpdateOrderInput,
} from "../types/orders.types";

import type { PaymentStatus } from "../../payments/types/payments.types";
import { ItemDisposition } from "../../inventory/types/inventory.types";

export const OrdersService = {
  // ------------------------------------------------------------------
  // Queries
  // ------------------------------------------------------------------

  async getOrders(): Promise<Order[]> {
    const raw = await ordersApi.list({ page_size: 200 });

    return adaptOrderList(raw);
  },

  async getOrderById(orderNo: string): Promise<Order> {
    try {
      const raw = await ordersApi.get(orderNo);

      return adaptOrder(raw);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to load order"));
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
    input: CreateOrderInput,
  ): Promise<Order> {
    try {
      const raw = await ordersApi.createDraft(
        adaptCreateOrderRequest(input),
      );

      return adaptOrder(raw);
    } catch (err) {
      throw new Error(
        getErrorMessage(err, "Failed to create draft order"),
      );
    }
  },

  async updateDraftOrder(
    orderNo: string,
    input: UpdateOrderInput,
  ): Promise<Order> {
    try {
      const raw = await ordersApi.update(
        orderNo,
        adaptUpdateOrderRequest(input),
      );

      return adaptOrder(raw);
    } catch (err) {
      throw new Error(
        getErrorMessage(err, "Failed to update draft order"),
      );
    }
  },

  async submitOrder(
    orderNo: string,
  ): Promise<Order> {
    try {
      const raw = await ordersApi.submit(orderNo);

      return adaptOrder(raw);
    } catch (err) {
      throw new Error(
        getErrorMessage(err, "Failed to submit order"),
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
      getErrorMessage(err, "Failed to create and submit order"),
    );
  }
},
  // ------------------------------------------------------------------
  // Order actions
  // ------------------------------------------------------------------

  async cancelOrder(
    orderNo: string,
    reason?: string,
  ): Promise<Order> {
    try {
      return adaptOrder(
        await ordersApi.cancel(orderNo, reason),
      );
    } catch (err) {
      throw new Error(
        getErrorMessage(err, "Failed to cancel order"),
      );
    }
  },

  async confirmDelivery(
    orderNo: string,
  ): Promise<Order> {
    try {
      return adaptOrder(
        await ordersApi.confirmDelivery(orderNo),
      );
    } catch (err) {
      throw new Error(
        getErrorMessage(err, "Failed to confirm order"),
      );
    }
  },

  // ------------------------------------------------------------------
  // Fulfillment
  // ------------------------------------------------------------------

  async updateFulfillmentStatus(
    orderNo: string,
    status: FulfillmentStatus,
  ): Promise<Order> {
    try {
      return adaptOrder(
        await ordersApi.updateFulfillment(
          orderNo,
          status,
        ),
      );
    } catch (err) {
      throw new Error(
        getErrorMessage(
          err,
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
    orderNo: string,
    _status: PaymentStatus,
  ): Promise<Order> {
    return this.getOrderById(orderNo);
  },

  // ------------------------------------------------------------------
  // Inventory
  // ------------------------------------------------------------------

  async updateOrderLineItem(
    orderNo: string,
    productId: string,
    inventoryItemIds: string[],
    disposition: ItemDisposition,
  ): Promise<Order> {
    // TODO:
    // Implement when the Inventory module is complete.
    void productId;
    void inventoryItemIds;
    void disposition;

    return this.getOrderById(orderNo);
  },

  // ------------------------------------------------------------------
  // Relationships
  // ------------------------------------------------------------------

  async assignToTrip(
    orderNo: string,
    tripId: string,
  ): Promise<Order> {
    try {
      return adaptOrder(
        await ordersApi.setTrip(orderNo, tripId),
      );
    } catch (err) {
      throw new Error(
        getErrorMessage(err, "Failed to assign trip"),
      );
    }
  },

  async setTrip(
    orderNo: string,
    tripId: string | null,
  ): Promise<Order> {
    try {
      return adaptOrder(
        await ordersApi.setTrip(orderNo, tripId),
      );
    } catch (err) {
      throw new Error(
        getErrorMessage(err, "Failed to update trip"),
      );
    }
  },

  async setInvoice(
    orderNo: string,
    invoiceId: string,
  ): Promise<Order> {
    try {
      return adaptOrder(
        await ordersApi.setInvoice(orderNo, invoiceId),
      );
    } catch (err) {
      throw new Error(
        getErrorMessage(err, "Failed to link invoice"),
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
