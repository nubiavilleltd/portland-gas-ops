import api from "@/lib/api";

export const invoicesApi = {
  list: async (params: { order_id?: string; status?: string; page?: number, page_size?:number } = {}) => {
    const { data } = await api.get("/api/invoices/", { params });
    return data;
  },

  get: async (invoiceNo: string) => {
    const { data } = await api.get(`/api/invoices/${invoiceNo}`);
    return data;
  },

  getByOrder: async (orderNo: string) => {
    const { data } = await api.get(`/api/invoices/by-order/${orderNo}`);
    return data;
  },

  create: async (input: { order_id: string; issued_date: string; due_date: string; notes?: string }) => {
    const { data } = await api.post("/api/invoices/", input);
    return data;
  },

  void: async (invoiceNo: string) => {
    const { data } = await api.post(`/api/invoices/${invoiceNo}/void`);
    return data;
  },
};