import api from "@/lib/api";
import type { CreateCustomerInput, UpdateCustomerInput } from "../types/customer.types";

export const customersApi = {
    list: async (params: {
        search?: string;
        type?: string;
        status?: string;
        page?: number;
        page_size?: number;
    } = {}) => {
        const { data } = await api.get("/api/customers", { params });
        return data;
    },

    get: async (customerNo: string) => {
        const { data } = await api.get(`/api/customers/${customerNo}`);
        return data;
    },

    create: async (input: CreateCustomerInput) => {
        const { data } = await api.post("/api/customers", {
            name: input.name,
            type: input.type,
            phone: input.phone,
            email: input.email,
            address: input.address,
        });
        return data;
    },

    update: async (customerNo: string, input: UpdateCustomerInput) => {
        const { data } = await api.put(`/api/customers/${customerNo}`, input);
        return data;
    },

    activate: async (customerNo: string) => {
        const { data } = await api.post(`/api/customers/${customerNo}/activate`);
        return data;
    },

    deactivate: async (customerNo: string) => {
        const { data } = await api.post(`/api/customers/${customerNo}/deactivate`);
        return data;
    },
    listOrders: async (customerNo: string) => {
        const { data } = await api.get(
            `/api/customers/${customerNo}/orders`
        );

        return data;
    },
};
