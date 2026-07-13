import api from "@/lib/api";
import type { PaymentMethod } from "../types/payments.types";

export const paymentsApi = {
    list: async (params: { invoice_id?: string; page_size?: number } = {}) => {
        const { data } = await api.get("/api/payments", { params });
        return data;
    },

    get: async (paymentNo: string) => {
        const { data } = await api.get(`/api/payments/${paymentNo}`);
        return data;
    },

    getByInvoice: async (invoiceNo: string) => {
        const { data } = await api.get(`/api/payments/by-invoice/${invoiceNo}`);
        return data;
    },

    record: async (
        input: {
            invoice_id: string;
            amount: number;
            method: PaymentMethod;
            payment_date: string;
            reference?: string;
        },
        idempotencyKey: string,
    ) => {
        const { data } = await api.post("/api/payments", input, {
            headers: { "Idempotency-Key": idempotencyKey },
        });
        return data;
    },
};
