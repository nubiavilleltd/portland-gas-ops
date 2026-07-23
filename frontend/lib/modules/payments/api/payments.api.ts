import api from "@/lib/api";
import type { PaymentMethod } from "../types/payments.types";

export const paymentsApi = {
    list: async (params: { invoice_id?: string; page_size?: number } = {}) => {
        const { data } = await api.get("/api/payments", { params });
        return data;
    },

    get: async (id: string) => {
        const { data } = await api.get(`/api/payments/${id}`);
        return data;
    },

    getByInvoice: async (id: string) => {
        const { data } = await api.get(`/api/payments/by-invoice/${id}`);
        return data;
    },

    record: async (
        input: FormData,
        idempotencyKey: string,
    ) => {
        const { data } = await api.post("/api/payments", input, {
            headers: { "Idempotency-Key": idempotencyKey },
        });
        return data;
    },
};
