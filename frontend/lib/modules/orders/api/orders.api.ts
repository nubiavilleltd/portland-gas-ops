// import api from "@/lib/api";
// import type { CreateOrderInput, UpdateOrderInput } from "../types/orders.types";

// export const ordersApi = {
//   list: async (params: {
//     search?: string;
//     order_status?: string;
//     fulfillment_status?: string;
//     payment_status?: string;
//     customer_id?: string;
//     page?: number;
//     page_size?: number;
//   } = {}) => {
//     const { data } = await api.get("/api/orders/", { params });
//     return data;
//   },

//   get: async (orderNo: string) => {
//     const { data } = await api.get(`/api/orders/${orderNo}`);
//     return data;
//   },

//   createDraft: async (input: CreateOrderInput) => {
//     const { data } = await api.post("/api/orders/", input);
//     return data;
//   },

//   update: async (orderNo: string, input: Partial<CreateOrderInput>) => {
//     const { data } = await api.put(`/api/orders/${orderNo}`, input);
//     return data;
//   },

//   submit: async (orderNo: string) => {
//     const { data } = await api.post(`/api/orders/${orderNo}/submit`);
//     return data;
//   },

//   confirm: async (orderNo: string) => {
//     const { data } = await api.post(`/api/orders/${orderNo}/confirm`);
//     return data;
//   },

//   cancel: async (orderNo: string, reason?: string) => {
//     const { data } = await api.post(`/api/orders/${orderNo}/cancel`, { reason });
//     return data;
//   },

//   confirmDelivery: async (orderNo: string) => {
//     const { data } = await api.post(`/api/orders/${orderNo}/confirm-delivery`);
//     return data;
//   },

//   updateFulfillment: async (orderNo: string, fulfillment_status: string) => {
//     const { data } = await api.patch(`/api/orders/${orderNo}/fulfillment`, { fulfillment_status });
//     return data;
//   },

//   setTrip: async (orderNo: string, trip_id: string | null) => {
//     const { data } = await api.patch(`/api/orders/${orderNo}/trip`, { trip_id });
//     return data;
//   },

//   setInvoice: async (orderNo: string, invoice_id: string) => {
//     const { data } = await api.patch(`/api/orders/${orderNo}/invoice`, { invoice_id });
//     return data;
//   },
// };







import api from "@/lib/api";

import type {
  CreateOrderRequest,
  UpdateOrderRequest,
} from "../adapters/order.adapter";

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
    const { data } = await api.get("/api/orders/", {
      params,
    });

    return data;
  },

  get: async (orderNo: string) => {
    const { data } = await api.get(
      `/api/orders/${orderNo}`,
    );

    return data;
  },

  createDraft: async (
    input: CreateOrderRequest,
  ) => {
    const { data } = await api.post(
      "/api/orders/",
      input,
    );

    return data;
  },

  update: async (
    orderNo: string,
    input: UpdateOrderRequest,
  ) => {
    const { data } = await api.put(
      `/api/orders/${orderNo}`,
      input,
    );

    return data;
  },

  submit: async (orderNo: string) => {
    const { data } = await api.post(
      `/api/orders/${orderNo}/submit`,
    );

    return data;
  },

  cancel: async (
    orderNo: string,
    reason?: string,
  ) => {
    const { data } = await api.post(
      `/api/orders/${orderNo}/cancel`,
      { reason },
    );

    return data;
  },

  confirmDelivery: async (orderNo: string) => {
    const { data } = await api.post(
      `/api/orders/${orderNo}/confirm-delivery`,
    );

    return data;
  },

  updateFulfillment: async (
    orderNo: string,
    fulfillment_status: string,
  ) => {
    const { data } = await api.patch(
      `/api/orders/${orderNo}/fulfillment`,
      { fulfillment_status },
    );

    return data;
  },

  setTrip: async (
    orderNo: string,
    trip_id: string | null,
  ) => {
    const { data } = await api.patch(
      `/api/orders/${orderNo}/trip`,
      { trip_id },
    );

    return data;
  },

  setInvoice: async (
    orderNo: string,
    invoice_id: string,
  ) => {
    const { data } = await api.patch(
      `/api/orders/${orderNo}/invoice`,
      { invoice_id },
    );

    return data;
  },
};