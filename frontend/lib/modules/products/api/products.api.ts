/**
 * Products API layer
 * Uses multipart/form-data for create/update because images are included.
 * List, get, activate, deactivate use standard JSON.
 */

import api from "@/lib/api";
import type {
  BackendCreateProductInput,
  BackendUpdateProductInput,
} from "../adapters/product.adapter";

export const productsApi = {
  list: async (
    params: {
      search?: string;
      product_type?: string;
      status?: string;
      page?: number;
      page_size?: number;
    } = {},
  ) => {
    const { data } = await api.get("/api/products", { params });
    return data;
  },

  get: async (id: string) => {
    const { data } = await api.get(`/api/products/${id}`);
    return data;
  },

  create: async (input: BackendCreateProductInput, imageFiles: File[]) => {
    const form = new FormData();

    form.append("data", JSON.stringify(input));

    imageFiles.forEach((file) => form.append("images", file));

    const { data } = await api.post("/api/products", form, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return data;
  },

  update: async (
    id: string,
    input: BackendUpdateProductInput,
    newImageFiles: File[],
    keptImageIds: string[],
    primaryImageId?: string,
  ) => {
    const form = new FormData();

    form.append("data", JSON.stringify(input));
    form.append("kept_image_ids", JSON.stringify(keptImageIds));
    if (primaryImageId) {
      form.append("primary_image_id", primaryImageId);
    }

    newImageFiles.forEach((file) => form.append("images", file));

    const { data } = await api.put(`/api/products/${id}`, form, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return data;
  },

  activate: async (id: string) => {
    const { data } = await api.post(`/api/products/${id}/activate`);
    return data;
  },

  deactivate: async (id: string) => {
    const { data } = await api.post(`/api/products/${id}/deactivate`);
    return data;
  },

  picker: async () => {
    const { data } = await api.get("/api/products/picker");
    return data;
  },
};
