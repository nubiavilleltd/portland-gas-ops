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
        const { data } = await api.get("/api/customers/", { params });
        return data;
    },

    get: async (id: string) => {
        const { data } = await api.get(`/api/customers/${id}`);
        return data;
    },

    create: async (input: CreateCustomerInput) => {
        const { data } = await api.post("/api/customers/", {
            name: input.name,
            type: input.type,
            phone: input.phone,
            email: input.email,
            address: input.address,
        });
        return data;
    },

    update: async (id: string, input: UpdateCustomerInput) => {
        const { data } = await api.put(`/api/customers/${id}`, input);
        return data;
    },

    activate: async (id: string) => {
        const { data } = await api.post(`/api/customers/${id}/activate`);
        return data;
    },

    deactivate: async (id: string) => {
        const { data } = await api.post(`/api/customers/${id}/deactivate`);
        return data;
    },
};