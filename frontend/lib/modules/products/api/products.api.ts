/**
 * Products API layer
 * Uses multipart/form-data for create/update because images are included.
 * List, get, activate, deactivate use standard JSON.
 */

import api from "@/lib/api";
import type { CreateProductInput, UpdateProductInput } from "../types/product.types";

export const productsApi = {
    list: async (params: {
        search?: string;
        product_type?: string;
        status?: string;
        page?: number;
        page_size?: number;
    } = {}) => {
        const { data } = await api.get("/api/products/", { params });
        return data;  // BackendProductList — adapter handles in service
    },

    get: async (productNo: string) => {
        const { data } = await api.get(`/api/products/${productNo}`);
        return data;  // BackendProduct
    },

    create: async (
        input: Omit<CreateProductInput, "images">,
        imageFiles: File[],
    ) => {
        const form = new FormData();
        // Product data goes as a JSON string in the 'data' field
        // This is required because multipart forms can't deeply nest JSON
        form.append("data", JSON.stringify({
            name: input.name,
            product_type: input.product_type,
            unit: input.unit,
            default_unit_price: input.default_unit_price,
            code: input.code,
            description: input.description,
            minimum_stock: input.minimum_stock,
        }));
        imageFiles.forEach((file) => form.append("images", file));

        const { data } = await api.post("/api/products/", form, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return data;
    },

    update: async (
        productNo: string,
        input: UpdateProductInput,
        newImageFiles: File[],
        keptImageIds: string[],
    ) => {
        const form = new FormData();
        form.append("data", JSON.stringify({
            name: input.name,
            product_type: input.product_type,
            unit: input.unit,
            default_unit_price: input.default_unit_price,
            code: input.code,
            description: input.description,
            minimum_stock: input.minimum_stock,
            status: input.status,
        }));
        form.append("kept_image_ids", JSON.stringify(keptImageIds));
        newImageFiles.forEach((file) => form.append("images", file));

        const { data } = await api.put(`/api/products/${productNo}`, form, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return data;
    },

    activate: async (productNo: string) => {
        const { data } = await api.post(`/api/products/${productNo}/activate`);
        return data;
    },

    deactivate: async (productNo: string) => {
        const { data } = await api.post(`/api/products/${productNo}/deactivate`);
        return data;
    },
};