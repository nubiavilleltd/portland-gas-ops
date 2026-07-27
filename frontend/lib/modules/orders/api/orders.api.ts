
import api from "@/lib/api";

import type {
  CreateOrderRequest,
  SaveDraftRequest,
  UpdateOrderRequest,
} from "../adapters/order.adapter";
import { ConfirmDeliveryPayload } from "../types/orders.types";

export const ordersApi = {
  list: async (
    params: {
      search?: string;
      order_status?: string;
      fulfillment_status?: string;
      payment_status?: string;
      customer_id?: string;
      page?: number;
      page_size?: number;
    } = {},
  ) => {
    const { data } = await api.get("/api/orders", {
      params,
    });

    return data;
  },

  get: async (orderId: string) => {
    const { data } = await api.get(
      `/api/orders/${orderId}`,
    );

    return data;
  },

  createDraft: async (
    input: SaveDraftRequest,
  ) => {
    const { data } = await api.post(
      "/api/orders",
      input,
    );

    return data;
  },

  update: async (
    orderId: string,
    input: SaveDraftRequest,
  ) => {
    const { data } = await api.put(
      `/api/orders/${orderId}`,
      input,
    );

    return data;
  },

  submit: async (orderId: string) => {
    const { data } = await api.post(
      `/api/orders/${orderId}/submit`,
    );

    return data;
  },

  createAndSubmit: async (input: CreateOrderRequest) => {
  const { data } = await api.post("/api/orders/submit", input);
  return data;
},

  cancel: async (
    orderId: string,
    reason?: string,
  ) => {
    const { data } = await api.post(
      `/api/orders/${orderId}/cancel`,
      { reason },
    );

    return data;
  },

  confirmDelivery: async (orderId: string, payload:ConfirmDeliveryPayload) => {
    const { data } = await api.post(
      `/api/orders/${orderId}/confirm-delivery`, {received_by: payload.receivedBy, delivery_notes:payload.deliveryNotes}
    );

    return data;
  },

  updateFulfillment: async (
    orderId: string,
    fulfillment_status: string,
  ) => {
    const { data } = await api.patch(
      `/api/orders/${orderId}/fulfillment`,
      { fulfillment_status },
    );

    return data;
  },

  setTrip: async (
    orderId: string,
    trip_id: string | null,
  ) => {
    const { data } = await api.patch(
      `/api/orders/${orderId}/trip`,
      { trip_id },
    );

    return data;
  },

  setInvoice: async (
    orderId: string,
    invoice_id: string,
  ) => {
    const { data } = await api.patch(
      `/api/orders/${orderId}/invoice`,
      { invoice_id },
    );

    return data;
  },
};
